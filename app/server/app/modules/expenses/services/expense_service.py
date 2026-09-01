from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from app.core.errors import ForbiddenError, InfrastructureError, NotFoundError, ValidationError
from app.modules.activity.services.activity import ActivityService
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.services.event_authorization_service import EventAuthorizationService
from app.modules.expenses.integrations.receipt_storage import ExpenseReceiptStorage
from app.modules.expenses.models.enums import ExpenseSplitType
from app.modules.expenses.models.expense import Expense
from app.modules.expenses.models.expense_split import ExpenseSplit
from app.modules.expenses.repositories.expense_repository import ExpenseRepository
from app.modules.expenses.repositories.expense_split_repository import ExpenseSplitRepository
from app.modules.expenses.repositories.unit_of_work import ExpenseUnitOfWork
from app.modules.expenses.schemas.expense_schemas import (
    ExpenseCreateRequest,
    ExpenseDetailRead,
    ExpenseReceiptRead,
    ExpenseSplitRead,
    ExpenseSplitRequest,
    ExpenseSummaryRead,
    ExpenseUpdateRequest,
)


class ExpenseService:
    def __init__(
        self,
        expense_repo: ExpenseRepository,
        split_repo: ExpenseSplitRepository,
        uow: ExpenseUnitOfWork,
        auth_service: EventAuthorizationService,
        member_repo: MemberRepository,
        activity_service: ActivityService | None = None,
        receipt_storage: ExpenseReceiptStorage | None = None,
    ):
        self.expense_repo = expense_repo
        self.split_repo = split_repo
        self.uow = uow
        self.auth_service = auth_service
        self.member_repo = member_repo
        self.activity_service = activity_service
        self.receipt_storage = receipt_storage

    @staticmethod
    def calculate_equal_splits(
        amount: Decimal, member_ids: list[UUID]
    ) -> list[tuple[UUID, Decimal]]:
        if amount <= Decimal("0.00"):
            raise ValidationError("El monto del gasto debe ser mayor a 0.")
        if not member_ids:
            raise ValidationError("Debe incluir al menos un participante.")

        unique_ids = list(dict.fromkeys(member_ids))
        if len(unique_ids) != len(member_ids):
            raise ValidationError("No se permiten participantes duplicados en el reparto.")

        sorted_members = sorted(unique_ids)
        total_cents = int(round(amount * Decimal("100")))
        n = len(sorted_members)
        base_cents = total_cents // n
        remainder_cents = total_cents % n

        splits: list[tuple[UUID, Decimal]] = []
        for index, member_id in enumerate(sorted_members):
            assigned_cents = base_cents + (1 if index < remainder_cents else 0)
            splits.append((member_id, Decimal(assigned_cents) / Decimal("100")))

        return splits

    @staticmethod
    def validate_exact_splits(
        amount: Decimal, splits_input: list[tuple[UUID, Decimal]] | list[ExpenseSplitRequest]
    ) -> list[tuple[UUID, Decimal]]:
        if amount <= Decimal("0.00"):
            raise ValidationError("El monto del gasto debe ser mayor a 0.")
        if not splits_input:
            raise ValidationError("Debe incluir al menos un participante.")

        normalized_splits: list[tuple[UUID, Decimal]] = []
        member_ids_seen: set[UUID] = set()

        for item in splits_input:
            m_id = item[0] if isinstance(item, tuple) else item.member_id
            amt = item[1] if isinstance(item, tuple) else item.assigned_amount
            if amt < Decimal("0.00"):
                raise ValidationError("La cuota asignada no puede ser negativa.")
            if m_id in member_ids_seen:
                raise ValidationError("No se permiten participantes duplicados en el reparto.")
            member_ids_seen.add(m_id)
            normalized_splits.append((m_id, amt))

        total_assigned = sum(s[1] for s in normalized_splits)
        if total_assigned != amount:
            raise ValidationError(
                f"La suma de las cuotas asignadas (Bs. {total_assigned:.2f}) "
                f"no coincide con el total del gasto (Bs. {amount:.2f})."
            )

        return normalized_splits

    def _get_active_event_members_map(self, event_id: UUID) -> dict[UUID, EventMember]:
        members = self.member_repo.get_active_members(event_id)
        return {m.id: m for m in members}

    def _require_expense_editor(self, expense: Expense, user_id: str) -> tuple[Event, EventMember]:
        event, active_member = self.auth_service.require_active_member(expense.event_id, user_id)
        self.auth_service.require_open(event)

        creator_member = self.member_repo.get_by_id(expense.created_by_member_id)
        is_creator = creator_member is not None and creator_member.user_id == user_id
        is_owner = event.user_id == user_id

        if not (is_creator or is_owner):
            raise ForbiddenError(
                "Solo el creador del gasto o el propietario del evento "
                "pueden modificar o eliminar el gasto."
            )

        return event, active_member

    def create_expense(
        self,
        event_id: UUID,
        user_id: str,
        request: ExpenseCreateRequest,
        receipt_file: tuple[bytes, str] | None = None,
    ) -> Expense:
        event, creator_member = self.auth_service.require_active_member(event_id, user_id)
        self.auth_service.require_open(event)

        active_members_map = self._get_active_event_members_map(event_id)

        if request.paid_by_member_id not in active_members_map:
            raise ValidationError("El miembro pagador debe ser un participante activo del evento.")

        if request.split_type == ExpenseSplitType.EQUAL:
            p_ids = request.participant_member_ids or list(active_members_map.keys())
            for p_id in p_ids:
                if p_id not in active_members_map:
                    raise ValidationError(
                        "Un participante seleccionado no pertenece a este evento o no está activo."
                    )
            calculated_splits = self.calculate_equal_splits(request.amount, p_ids)
        elif request.split_type == ExpenseSplitType.EXACT:
            if not request.splits:
                raise ValidationError(
                    "Debe especificar los montos de cuotas para la división exacta."
                )
            for s in request.splits:
                if s.member_id not in active_members_map:
                    raise ValidationError(
                        "Un participante en el reparto no pertenece a este evento o no está activo."
                    )
            calculated_splits = self.validate_exact_splits(request.amount, request.splits)
        else:
            raise ValidationError("Tipo de división de gasto no soportado.")

        uploaded_receipt_public_id: str | None = None
        receipt_url: str | None = None

        if receipt_file is not None and self.receipt_storage is not None:
            content, content_type = receipt_file
            stored = self.receipt_storage.upload_receipt(content, str(event_id), content_type)
            receipt_url = stored.secure_url
            uploaded_receipt_public_id = stored.public_id

        try:
            expense = Expense(
                event_id=event_id,
                created_by_member_id=creator_member.id,
                paid_by_member_id=request.paid_by_member_id,
                name=request.name.strip(),
                description=request.description.strip() if request.description else None,
                amount=request.amount,
                category=request.category,
                split_type=request.split_type,
                expense_date=request.expense_date,
                receipt_url=receipt_url,
                receipt_public_id=uploaded_receipt_public_id,
            )
            created_expense = self.expense_repo.create(expense)

            splits_to_create = [
                ExpenseSplit(
                    expense_id=created_expense.id,
                    member_id=member_id,
                    assigned_amount=assigned_amt,
                )
                for member_id, assigned_amt in calculated_splits
            ]
            self.split_repo.create_all(splits_to_create)

            if self.activity_service:
                actor_name = self.auth_service.events.owner_name(user_id) or "Usuario"
                self.activity_service.log_activity(
                    event_id=str(event_id),
                    actor_id=user_id,
                    actor_name=actor_name,
                    action_type="expense_created",
                    description=(
                        f'{actor_name} registró el gasto "{created_expense.name}" '
                        f"por Bs. {created_expense.amount:.2f}."
                    ),
                    target_id=str(created_expense.id),
                    target_name=created_expense.name,
                )

            self.uow.commit()
            return created_expense
        except Exception:
            self.uow.rollback()
            if uploaded_receipt_public_id and self.receipt_storage is not None:
                try:
                    self.receipt_storage.destroy(uploaded_receipt_public_id)
                except Exception:
                    pass
            raise

    def list_event_expenses(
        self, event_id: UUID, user_id: str, filter_type: str = "all"
    ) -> list[ExpenseSummaryRead]:
        event, current_member = self.auth_service.require_active_member(event_id, user_id)
        expenses = self.expense_repo.list_by_event(event_id)

        members_with_users = self.member_repo.list_active_with_users(event_id)
        member_names = {m.id: u.name for m, u in members_with_users}

        result: list[ExpenseSummaryRead] = []
        for exp in expenses:
            splits = self.split_repo.list_active_by_expense(exp.id)
            is_payer = exp.paid_by_member_id == current_member.id
            is_participant = any(s.member_id == current_member.id for s in splits)

            if filter_type == "mine" and not (is_payer or is_participant):
                continue
            elif filter_type == "others" and (is_payer or is_participant):
                continue

            paid_by_member = self.member_repo.get_by_id(exp.paid_by_member_id)
            payer_name = (
                member_names.get(exp.paid_by_member_id)
                or (
                    self.auth_service.events.owner_name(paid_by_member.user_id)
                    if paid_by_member
                    else None
                )
                or "Usuario"
            )

            result.append(
                ExpenseSummaryRead(
                    id=exp.id,
                    event_id=exp.event_id,
                    name=exp.name,
                    description=exp.description,
                    amount=exp.amount,
                    category=exp.category,
                    split_type=exp.split_type,
                    expense_date=exp.expense_date,
                    paid_by_member_id=exp.paid_by_member_id,
                    paid_by_member_name=payer_name,
                    has_receipt=bool(exp.receipt_url),
                    created_at=exp.created_at,
                )
            )
        return result

    def get_expense_detail(self, expense_id: UUID, user_id: str) -> ExpenseDetailRead:
        expense = self.expense_repo.get_by_id(expense_id)
        if expense is None:
            raise NotFoundError("Gasto no encontrado.")

        event, _ = self.auth_service.require_active_member(expense.event_id, user_id)
        splits = self.split_repo.list_active_by_expense(expense.id)

        members_with_users = self.member_repo.list_active_with_users(expense.event_id)
        member_names = {m.id: u.name for m, u in members_with_users}

        created_by_member = self.member_repo.get_by_id(expense.created_by_member_id)
        paid_by_member = self.member_repo.get_by_id(expense.paid_by_member_id)

        created_by_name = (
            member_names.get(expense.created_by_member_id)
            or (
                self.auth_service.events.owner_name(created_by_member.user_id)
                if created_by_member
                else None
            )
            or "Usuario"
        )
        paid_by_name = (
            member_names.get(expense.paid_by_member_id)
            or (
                self.auth_service.events.owner_name(paid_by_member.user_id)
                if paid_by_member
                else None
            )
            or "Usuario"
        )

        splits_read: list[ExpenseSplitRead] = []
        for s in splits:
            m_obj = self.member_repo.get_by_id(s.member_id)
            m_name = (
                member_names.get(s.member_id)
                or (self.auth_service.events.owner_name(m_obj.user_id) if m_obj else None)
                or "Miembro"
            )
            splits_read.append(
                ExpenseSplitRead(
                    id=s.id,
                    member_id=s.member_id,
                    member_name=m_name,
                    assigned_amount=s.assigned_amount,
                )
            )

        return ExpenseDetailRead(
            id=expense.id,
            event_id=expense.event_id,
            name=expense.name,
            description=expense.description,
            amount=expense.amount,
            category=expense.category,
            split_type=expense.split_type,
            expense_date=expense.expense_date,
            receipt_url=expense.receipt_url,
            created_by_member_id=expense.created_by_member_id,
            created_by_member_name=created_by_name,
            paid_by_member_id=expense.paid_by_member_id,
            paid_by_member_name=paid_by_name,
            created_at=expense.created_at,
            updated_at=expense.updated_at,
            splits=splits_read,
        )

    def update_expense(
        self,
        expense_id: UUID,
        user_id: str,
        request: ExpenseUpdateRequest,
        receipt_file: tuple[bytes, str] | None = None,
    ) -> ExpenseDetailRead:
        expense = self.expense_repo.get_by_id(expense_id)
        if expense is None:
            raise NotFoundError("Gasto no encontrado.")

        event, _ = self._require_expense_editor(expense, user_id)
        active_members_map = self._get_active_event_members_map(expense.event_id)

        if request.name is not None:
            expense.name = request.name.strip()
        if request.description is not None:
            expense.description = request.description.strip() if request.description else None
        if request.amount is not None:
            expense.amount = request.amount
        if request.category is not None:
            expense.category = request.category
        if request.split_type is not None:
            expense.split_type = request.split_type
        if request.expense_date is not None:
            expense.expense_date = request.expense_date
        if request.paid_by_member_id is not None:
            if request.paid_by_member_id not in active_members_map:
                raise ValidationError(
                    "El miembro pagador debe ser un participante activo del evento."
                )
            expense.paid_by_member_id = request.paid_by_member_id

        recalculate_splits = (
            request.participant_member_ids is not None
            or request.splits is not None
            or request.amount is not None
            or request.split_type is not None
        )

        calculated_splits: list[tuple[UUID, Decimal]] | None = None
        if recalculate_splits:
            if expense.split_type == ExpenseSplitType.EQUAL:
                p_ids = request.participant_member_ids
                if p_ids is None:
                    existing_active = self.split_repo.list_active_by_expense(expense.id)
                    p_ids = [s.member_id for s in existing_active] or list(
                        active_members_map.keys()
                    )
                for p_id in p_ids:
                    if p_id not in active_members_map:
                        raise ValidationError(
                            "Un participante seleccionado no pertenece a este "
                            "evento o no está activo."
                        )
                calculated_splits = self.calculate_equal_splits(expense.amount, p_ids)
            elif expense.split_type == ExpenseSplitType.EXACT:
                if not request.splits:
                    raise ValidationError(
                        "Debe especificar los montos de cuotas para la división exacta."
                    )
                for s in request.splits:
                    if s.member_id not in active_members_map:
                        raise ValidationError(
                            "Un participante en el reparto no pertenece a este "
                            "evento o no está activo."
                        )
                calculated_splits = self.validate_exact_splits(expense.amount, request.splits)

        uploaded_receipt_public_id: str | None = None
        old_receipt_public_id = expense.receipt_public_id

        if receipt_file is not None and self.receipt_storage is not None:
            content, content_type = receipt_file
            stored = self.receipt_storage.upload_receipt(
                content, str(expense.event_id), content_type
            )
            expense.receipt_url = stored.secure_url
            expense.receipt_public_id = stored.public_id
            uploaded_receipt_public_id = stored.public_id

        try:
            self.expense_repo.update(expense)

            if calculated_splits is not None:
                existing_splits = self.split_repo.list_all_by_expense(
                    expense.id, include_deleted=True
                )
                existing_by_member = {s.member_id: s for s in existing_splits}
                target_member_ids = {m_id for m_id, _ in calculated_splits}

                for m_id, assigned_amt in calculated_splits:
                    if m_id in existing_by_member:
                        sp = existing_by_member[m_id]
                        sp.assigned_amount = assigned_amt
                        sp.deleted_at = None
                        self.split_repo.update(sp)
                    else:
                        new_sp = ExpenseSplit(
                            expense_id=expense.id,
                            member_id=m_id,
                            assigned_amount=assigned_amt,
                        )
                        self.split_repo.create(new_sp)

                for s in existing_splits:
                    if s.deleted_at is None and s.member_id not in target_member_ids:
                        s.deleted_at = datetime.now(UTC)
                        self.split_repo.update(s)

            if self.activity_service:
                actor_name = self.auth_service.events.owner_name(user_id) or "Usuario"
                self.activity_service.log_activity(
                    event_id=str(expense.event_id),
                    actor_id=user_id,
                    actor_name=actor_name,
                    action_type="expense_updated",
                    description=f'{actor_name} actualizó el gasto "{expense.name}".',
                    target_id=str(expense.id),
                    target_name=expense.name,
                )

            self.uow.commit()

            if (
                uploaded_receipt_public_id
                and old_receipt_public_id
                and self.receipt_storage is not None
            ):
                try:
                    self.receipt_storage.destroy(old_receipt_public_id)
                except Exception:
                    pass

            return self.get_expense_detail(expense.id, user_id)
        except Exception:
            self.uow.rollback()
            if uploaded_receipt_public_id and self.receipt_storage is not None:
                try:
                    self.receipt_storage.destroy(uploaded_receipt_public_id)
                except Exception:
                    pass
            raise

    def delete_expense(self, expense_id: UUID, user_id: str) -> None:
        expense = self.expense_repo.get_by_id(expense_id)
        if expense is None:
            raise NotFoundError("Gasto no encontrado.")

        event, _ = self._require_expense_editor(expense, user_id)

        try:
            self.expense_repo.soft_delete(expense)

            if self.activity_service:
                actor_name = self.auth_service.events.owner_name(user_id) or "Usuario"
                self.activity_service.log_activity(
                    event_id=str(expense.event_id),
                    actor_id=user_id,
                    actor_name=actor_name,
                    action_type="expense_deleted",
                    description=f'{actor_name} eliminó el gasto "{expense.name}".',
                    target_id=str(expense.id),
                    target_name=expense.name,
                )

            self.uow.commit()
        except Exception:
            self.uow.rollback()
            raise

    def replace_receipt(
        self,
        expense_id: UUID,
        user_id: str,
        file_content: bytes,
        content_type: str | None = None,
    ) -> ExpenseReceiptRead:
        expense = self.expense_repo.get_by_id(expense_id)
        if expense is None:
            raise NotFoundError("Gasto no encontrado.")

        self._require_expense_editor(expense, user_id)
        if self.receipt_storage is None:
            raise InfrastructureError("Almacenamiento de comprobantes no configurado.")

        old_public_id = expense.receipt_public_id
        stored = self.receipt_storage.upload_receipt(
            file_content, str(expense.event_id), content_type
        )

        expense.receipt_url = stored.secure_url
        expense.receipt_public_id = stored.public_id

        try:
            self.expense_repo.update(expense)
            self.uow.commit()
            if old_public_id:
                try:
                    self.receipt_storage.destroy(old_public_id)
                except Exception:
                    pass
            return ExpenseReceiptRead(expense_id=expense.id, receipt_url=stored.secure_url)
        except Exception:
            self.uow.rollback()
            try:
                self.receipt_storage.destroy(stored.public_id)
            except Exception:
                pass
            raise

    def delete_receipt(self, expense_id: UUID, user_id: str) -> None:
        expense = self.expense_repo.get_by_id(expense_id)
        if expense is None:
            raise NotFoundError("Gasto no encontrado.")

        self._require_expense_editor(expense, user_id)
        old_public_id = expense.receipt_public_id

        expense.receipt_url = None
        expense.receipt_public_id = None

        try:
            self.expense_repo.update(expense)
            self.uow.commit()
            if old_public_id and self.receipt_storage is not None:
                try:
                    self.receipt_storage.destroy(old_public_id)
                except Exception:
                    pass
        except Exception:
            self.uow.rollback()
            raise
