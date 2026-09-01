"""Casos de uso financieros del módulo Expenses."""

from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID

from app.core.errors import InfrastructureError, NotFoundError, ValidationError
from app.modules.activity.services.activity import ActivityService
from app.modules.events.services.expense_context_service import ExpenseContextService
from app.modules.expenses.integrations.gemini_analyzer import GeminiReceiptAnalyzer
from app.modules.expenses.integrations.receipt_storage import ExpenseReceiptStorage
from app.modules.expenses.models.enums import ExpenseSplitType
from app.modules.expenses.models.expense import Expense
from app.modules.expenses.models.expense_split import ExpenseSplit
from app.modules.expenses.repositories.expense_repository import ExpenseRepository
from app.modules.expenses.repositories.expense_split_repository import ExpenseSplitRepository
from app.modules.expenses.repositories.unit_of_work import ExpenseUnitOfWork
from app.modules.expenses.schemas.expense_schemas import (
    DebtToCollectItem,
    DebtToPayItem,
    DebtsSummaryRead,
    ExpenseCreateRequest,
    ExpenseDetailRead,
    ExpenseRead,
    ExpenseReceiptRead,
    ExpenseSplitRead,
    ExpenseSplitRequest,
    ExpenseSummaryRead,
    ExpenseUpdateRequest,
    ReceiptAnalysisResponse,
)

CENT = Decimal("0.01")


class ExpenseService:
    """Aplica invariantes financieros y coordina su persistencia atómica."""

    def __init__(
        self,
        expense_repo: ExpenseRepository,
        split_repo: ExpenseSplitRepository,
        uow: ExpenseUnitOfWork,
        event_context: ExpenseContextService,
        activity_service: ActivityService | None = None,
        receipt_storage: ExpenseReceiptStorage | None = None,
        gemini_analyzer: GeminiReceiptAnalyzer | None = None,
    ):
        self.expense_repo = expense_repo
        self.split_repo = split_repo
        self.uow = uow
        self.event_context = event_context
        self.activity_service = activity_service
        self.receipt_storage = receipt_storage
        self.gemini_analyzer = gemini_analyzer

    @staticmethod
    def _to_cents(amount: Decimal) -> int:
        return int((amount.quantize(CENT, rounding=ROUND_HALF_UP) * 100).to_integral_value())

    @staticmethod
    def _from_cents(cents: int) -> Decimal:
        return (Decimal(cents) / Decimal(100)).quantize(CENT)

    @staticmethod
    def _unique_member_ids(member_ids: list[UUID]) -> list[UUID]:
        if len(set(member_ids)) != len(member_ids):
            raise ValidationError("No se permiten participantes duplicados en el reparto.")
        return sorted(member_ids)

    @classmethod
    def calculate_equal_distribution(
        cls,
        amount: Decimal,
        other_member_ids: list[UUID],
        payer_member_id: UUID,
        payer_participated: bool,
    ) -> tuple[list[tuple[UUID, Decimal]], Decimal]:
        """Divide entre consumidores y omite siempre la cuota del pagador."""
        if amount <= Decimal("0.00"):
            raise ValidationError("El monto del gasto debe ser mayor a 0.")

        others = cls._unique_member_ids(other_member_ids)
        if payer_member_id in others:
            raise ValidationError(
                "El pagador no puede tener una cuota de deuda en su propio gasto."
            )
        if not others and not payer_participated:
            raise ValidationError(
                "Selecciona al menos una persona cuando indicas que no participaste en el gasto."
            )
        if not others:
            return [], Decimal("0.00")

        consumers = ([payer_member_id] if payer_participated else []) + others
        total_cents = cls._to_cents(amount)
        base, remainder = divmod(total_cents, len(consumers))
        amounts_by_member = {
            member_id: base + (1 if index < remainder else 0)
            for index, member_id in enumerate(consumers)
        }
        splits = [
            (member_id, cls._from_cents(amounts_by_member[member_id])) for member_id in others
        ]
        return splits, sum((assigned for _, assigned in splits), Decimal("0.00"))

    @classmethod
    def calculate_equal_splits(
        cls, amount: Decimal, member_ids: list[UUID]
    ) -> list[tuple[UUID, Decimal]]:
        """Compatibilidad de cálculo puro para consumidores sin pagador explícito."""
        if amount <= Decimal("0.00"):
            raise ValidationError("El monto del gasto debe ser mayor a 0.")
        members = cls._unique_member_ids(member_ids)
        if not members:
            raise ValidationError("Debe incluir al menos un participante.")
        total_cents = cls._to_cents(amount)
        base, remainder = divmod(total_cents, len(members))
        return [
            (member_id, cls._from_cents(base + (1 if index < remainder else 0)))
            for index, member_id in enumerate(members)
        ]

    @classmethod
    def calculate_exact_distribution(
        cls,
        amount: Decimal,
        splits_input: list[ExpenseSplitRequest] | list[tuple[UUID, Decimal]],
        payer_member_id: UUID,
        payer_participated: bool,
    ) -> tuple[list[tuple[UUID, Decimal]], Decimal]:
        """Normaliza cuotas positivas y conserva la diferencia como aporte propio."""
        if amount <= Decimal("0.00"):
            raise ValidationError("El monto del gasto debe ser mayor a 0.")
        normalized: list[tuple[UUID, Decimal]] = []
        payer_amount: Decimal | None = None
        seen: set[UUID] = set()
        for item in splits_input:
            member_id = item.member_id if isinstance(item, ExpenseSplitRequest) else item[0]
            assigned = item.assigned_amount if isinstance(item, ExpenseSplitRequest) else item[1]
            assigned = assigned.quantize(CENT, rounding=ROUND_HALF_UP)
            if assigned < Decimal("0.00"):
                raise ValidationError("La cuota asignada no puede ser negativa.")
            if member_id == payer_member_id:
                if not payer_participated:
                    raise ValidationError("El pagador no puede aparecer si no participó en el gasto.")
                if payer_amount is not None:
                    raise ValidationError("No se permiten participantes duplicados en el reparto.")
                payer_amount = assigned
                continue
            if member_id in seen:
                raise ValidationError("No se permiten participantes duplicados en el reparto.")
            seen.add(member_id)
            if assigned > Decimal("0.00"):
                normalized.append((member_id, assigned))

        refund = sum((assigned for _, assigned in normalized), Decimal("0.00")).quantize(CENT)
        if refund > amount:
            raise ValidationError("La devolución no puede superar el monto total del gasto.")
        if not payer_participated and refund != amount:
            raise ValidationError(
                "Si no participaste, las cuotas de los demás deben cubrir el monto total."
            )
        if payer_participated and payer_amount is not None and payer_amount + refund != amount:
            raise ValidationError(
                "El aporte del pagador y la devolución deben coincidir con el monto total."
            )
        return normalized, refund

    @staticmethod
    def validate_exact_splits(
        amount: Decimal, splits_input: list[tuple[UUID, Decimal]] | list[ExpenseSplitRequest]
    ) -> list[tuple[UUID, Decimal]]:
        """Compatibilidad de la validación histórica usada por pruebas existentes."""
        member_ids = [
            item.member_id if isinstance(item, ExpenseSplitRequest) else item[0]
            for item in splits_input
        ]
        if len(member_ids) != len(set(member_ids)):
            raise ValidationError("No se permiten participantes duplicados en el reparto.")
        normalized = [
            (
                item.member_id if isinstance(item, ExpenseSplitRequest) else item[0],
                (
                    item.assigned_amount if isinstance(item, ExpenseSplitRequest) else item[1]
                ).quantize(CENT),
            )
            for item in splits_input
        ]
        if sum((value for _, value in normalized), Decimal("0.00")) != amount:
            raise ValidationError(
                f"La suma de las cuotas asignadas no coincide con el total del gasto (Bs. {amount:.2f})."
            )
        return normalized

    def _validate_other_members(
        self, event_id: UUID, payer_id: UUID, member_ids: list[UUID]
    ) -> None:
        active_members = self.event_context.get_active_members(event_id)
        for member_id in member_ids:
            if member_id == payer_id:
                raise ValidationError(
                    "El pagador no puede tener una cuota de deuda en su propio gasto."
                )
            if member_id not in active_members:
                raise ValidationError(
                    "Un participante seleccionado no pertenece a este evento o no está activo."
                )

    def _calculate_distribution(
        self,
        event_id: UUID,
        payer_id: UUID,
        amount: Decimal,
        split_type: ExpenseSplitType,
        payer_participated: bool,
        participant_member_ids: list[UUID] | None,
        splits: list[ExpenseSplitRequest] | None,
    ) -> tuple[list[tuple[UUID, Decimal]], Decimal]:
        if split_type == ExpenseSplitType.EQUAL:
            participants = participant_member_ids or []
            self._validate_other_members(event_id, payer_id, participants)
            return self.calculate_equal_distribution(
                amount, participants, payer_id, payer_participated
            )
        if split_type == ExpenseSplitType.EXACT:
            exact_splits = splits or []
            self._validate_other_members(
                event_id,
                payer_id,
                [item.member_id for item in exact_splits if item.member_id != payer_id],
            )
            return self.calculate_exact_distribution(
                amount, exact_splits, payer_id, payer_participated
            )
        raise ValidationError("Tipo de división de gasto no soportado.")

    @staticmethod
    def _contribution(expense: Expense) -> Decimal:
        return (expense.amount - expense.refund_amount).quantize(CENT)

    def _expense_read(self, expense: Expense) -> ExpenseRead:
        return ExpenseRead(
            id=expense.id,
            event_id=expense.event_id,
            created_by_member_id=expense.created_by_member_id,
            paid_by_member_id=expense.paid_by_member_id,
            name=expense.name,
            description=expense.description,
            amount=expense.amount,
            refund_amount=expense.refund_amount,
            payer_contribution=self._contribution(expense),
            payer_participated=expense.payer_participated,
            category=expense.category,
            split_type=expense.split_type,
            expense_date=expense.expense_date,
            receipt_url=expense.receipt_url,
            created_at=expense.created_at,
            updated_at=expense.updated_at,
        )

    def create_expense(
        self,
        event_id: UUID,
        user_id: str,
        request: ExpenseCreateRequest,
        receipt_file: tuple[bytes, str] | None = None,
    ) -> ExpenseRead:
        context = self.event_context.require_active_member(event_id, user_id)
        payer_id = context.current_member.id
        calculated_splits, refund_amount = self._calculate_distribution(
            event_id,
            payer_id,
            request.amount,
            request.split_type,
            request.payer_participated,
            request.participant_member_ids,
            request.splits,
        )
        uploaded_receipt_public_id: str | None = None
        receipt_url = request.receipt_url
        if receipt_file is not None and self.receipt_storage is not None:
            content, content_type = receipt_file
            stored = self.receipt_storage.upload_receipt(content, str(event_id), content_type)
            receipt_url, uploaded_receipt_public_id = stored.secure_url, stored.public_id
        try:
            expense = self.expense_repo.create(
                Expense(
                    event_id=event_id,
                    created_by_member_id=payer_id,
                    paid_by_member_id=payer_id,
                    name=request.name.strip(),
                    description=request.description.strip() if request.description else None,
                    amount=request.amount.quantize(CENT),
                    refund_amount=refund_amount,
                    payer_participated=request.payer_participated,
                    category=request.category,
                    split_type=request.split_type,
                    expense_date=request.expense_date,
                    receipt_url=receipt_url,
                    receipt_public_id=uploaded_receipt_public_id,
                )
            )
            self.split_repo.create_all(
                [
                    ExpenseSplit(
                        expense_id=expense.id, member_id=member_id, assigned_amount=assigned
                    )
                    for member_id, assigned in calculated_splits
                ]
            )
            if self.activity_service:
                actor_name = self.event_context.actor_name(user_id)
                self.activity_service.log_activity(
                    event_id=str(event_id),
                    actor_id=user_id,
                    actor_name=actor_name,
                    action_type="expense_created",
                    description=f'{actor_name} registró el gasto "{expense.name}" por Bs. {expense.amount:.2f}.',
                    target_id=str(expense.id),
                    target_name=expense.name,
                )
            self.uow.commit()
            return self._expense_read(expense)
        except Exception:
            self.uow.rollback()
            if uploaded_receipt_public_id and self.receipt_storage:
                try:
                    self.receipt_storage.destroy(uploaded_receipt_public_id)
                except Exception:
                    pass
            raise

    def list_event_expenses(
        self, event_id: UUID, user_id: str, filter_type: str = "all"
    ) -> list[ExpenseSummaryRead]:
        context = self.event_context.require_active_member(event_id, user_id)
        result: list[ExpenseSummaryRead] = []
        for expense in self.expense_repo.list_by_event(event_id):
            splits = self.split_repo.list_active_by_expense(expense.id)
            is_payer = expense.paid_by_member_id == context.current_member.id
            is_participant = any(split.member_id == context.current_member.id for split in splits)
            if filter_type == "mine" and not (is_payer or is_participant):
                continue
            if filter_type == "others" and (is_payer or is_participant):
                continue
            result.append(
                ExpenseSummaryRead(
                    id=expense.id,
                    event_id=expense.event_id,
                    name=expense.name,
                    description=expense.description,
                    amount=expense.amount,
                    refund_amount=expense.refund_amount,
                    payer_contribution=self._contribution(expense),
                    payer_participated=expense.payer_participated,
                    category=expense.category,
                    split_type=expense.split_type,
                    expense_date=expense.expense_date,
                    paid_by_member_id=expense.paid_by_member_id,
                    paid_by_member_name=self.event_context.member_name(expense.paid_by_member_id),
                    has_receipt=bool(expense.receipt_url),
                    created_at=expense.created_at,
                )
            )
        return result

    def get_expense_detail(self, expense_id: UUID, user_id: str) -> ExpenseDetailRead:
        expense = self.expense_repo.get_by_id(expense_id)
        if expense is None:
            raise NotFoundError("Gasto no encontrado.")
        context = self.event_context.require_active_member(expense.event_id, user_id)

        splits_raw = [
            split
            for split in self.split_repo.list_active_by_expense(expense.id)
            if split.member_id != expense.paid_by_member_id
            and split.assigned_amount > Decimal("0.00")
        ]
        split_ids = [s.id for s in splits_raw]

        payments_by_split = {}
        if split_ids:
            from sqlmodel import col, desc, select

            from app.modules.payments.models.payment import Payment

            payments = list(
                self.split_repo.session.exec(
                    select(Payment)
                    .where(
                        col(Payment.split_id).in_(split_ids),
                        Payment.deleted_at.is_(None),
                    )
                    .order_by(desc(Payment.created_at))
                ).all()
            )
            for p in payments:
                if p.split_id not in payments_by_split:
                    payments_by_split[p.split_id] = p
                elif p.status == "confirmed":
                    payments_by_split[p.split_id] = p

        splits_read: list[ExpenseSplitRead] = []
        current_user_split: ExpenseSplitRead | None = None
        is_payer = context.current_member.id == expense.paid_by_member_id

        for split in splits_raw:
            payment = payments_by_split.get(split.id)
            payment_status = "no_payment"
            payment_id = None
            payment_method = None
            proof_image_url = None

            if payment:
                payment_status = (
                    payment.status.value
                    if hasattr(payment.status, "value")
                    else str(payment.status)
                )
                payment_id = payment.id
                payment_method = (
                    payment.payment_method.value
                    if hasattr(payment.payment_method, "value")
                    else str(payment.payment_method)
                )
                proof_image_url = payment.proof_image_url

            item = ExpenseSplitRead(
                id=split.id,
                member_id=split.member_id,
                member_name=self.event_context.member_name(split.member_id, "Miembro"),
                assigned_amount=split.assigned_amount,
                payment_status=payment_status,
                payment_id=payment_id,
                payment_method=payment_method,
                proof_image_url=proof_image_url,
            )
            splits_read.append(item)
            if split.member_id == context.current_member.id:
                current_user_split = item

        return ExpenseDetailRead(
            id=expense.id,
            event_id=expense.event_id,
            name=expense.name,
            description=expense.description,
            amount=expense.amount,
            refund_amount=expense.refund_amount,
            payer_contribution=self._contribution(expense),
            payer_participated=expense.payer_participated,
            category=expense.category,
            split_type=expense.split_type,
            expense_date=expense.expense_date,
            receipt_url=expense.receipt_url,
            created_by_member_id=expense.created_by_member_id,
            created_by_member_name=self.event_context.member_name(expense.created_by_member_id),
            paid_by_member_id=expense.paid_by_member_id,
            paid_by_member_name=self.event_context.member_name(expense.paid_by_member_id),
            is_payer=is_payer,
            current_user_split=current_user_split,
            created_at=expense.created_at,
            updated_at=expense.updated_at,
            splits=splits_read,
        )

    def _sync_splits(self, expense: Expense, calculated: list[tuple[UUID, Decimal]]) -> None:
        existing = self.split_repo.list_all_by_expense(expense.id, include_deleted=True)
        by_member = {split.member_id: split for split in existing}
        targets = {member_id for member_id, _ in calculated}
        for member_id, assigned in calculated:
            split = by_member.get(member_id)
            if split is None:
                self.split_repo.create(
                    ExpenseSplit(
                        expense_id=expense.id, member_id=member_id, assigned_amount=assigned
                    )
                )
            else:
                split.assigned_amount, split.deleted_at = assigned, None
                self.split_repo.update(split)
        for split in existing:
            if split.deleted_at is None and split.member_id not in targets:
                split.deleted_at = datetime.now(UTC)
                self.split_repo.update(split)

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
        self.event_context.require_expense_editor(
            expense.event_id, expense.created_by_member_id, user_id
        )
        if request.name is not None:
            expense.name = request.name.strip()
        if request.description is not None:
            expense.description = request.description.strip() if request.description else None
        if request.amount is not None:
            expense.amount = request.amount.quantize(CENT)
        if request.category is not None:
            expense.category = request.category
        if request.split_type is not None:
            expense.split_type = request.split_type
        if request.expense_date is not None:
            expense.expense_date = request.expense_date
        if request.payer_participated is not None:
            expense.payer_participated = request.payer_participated

        recalculate = any(
            (
                request.amount is not None,
                request.split_type is not None,
                request.payer_participated is not None,
                request.participant_member_ids is not None,
                request.splits is not None,
            )
        )
        calculated: list[tuple[UUID, Decimal]] | None = None
        if recalculate:
            existing = self.split_repo.list_active_by_expense(expense.id)
            participants = request.participant_member_ids
            exact_splits = request.splits
            if expense.split_type == ExpenseSplitType.EQUAL and participants is None:
                participants = [
                    split.member_id
                    for split in existing
                    if split.member_id != expense.paid_by_member_id
                ]
            if expense.split_type == ExpenseSplitType.EXACT and exact_splits is None:
                exact_splits = [
                    ExpenseSplitRequest(
                        member_id=split.member_id, assigned_amount=split.assigned_amount
                    )
                    for split in existing
                    if split.member_id != expense.paid_by_member_id
                ]
            calculated, expense.refund_amount = self._calculate_distribution(
                expense.event_id,
                expense.paid_by_member_id,
                expense.amount,
                expense.split_type,
                expense.payer_participated,
                participants,
                exact_splits,
            )

        uploaded_receipt_public_id: str | None = None
        old_receipt_public_id = expense.receipt_public_id
        if receipt_file is not None and self.receipt_storage is not None:
            stored = self.receipt_storage.upload_receipt(
                receipt_file[0], str(expense.event_id), receipt_file[1]
            )
            expense.receipt_url, expense.receipt_public_id = stored.secure_url, stored.public_id
            uploaded_receipt_public_id = stored.public_id
        try:
            self.expense_repo.update(expense)
            if calculated is not None:
                self._sync_splits(expense, calculated)
            if self.activity_service:
                actor_name = self.event_context.actor_name(user_id)
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
            if uploaded_receipt_public_id and old_receipt_public_id and self.receipt_storage:
                try:
                    self.receipt_storage.destroy(old_receipt_public_id)
                except Exception:
                    pass
            return self.get_expense_detail(expense.id, user_id)
        except Exception:
            self.uow.rollback()
            if uploaded_receipt_public_id and self.receipt_storage:
                try:
                    self.receipt_storage.destroy(uploaded_receipt_public_id)
                except Exception:
                    pass
            raise

    def delete_expense(self, expense_id: UUID, user_id: str) -> None:
        expense = self.expense_repo.get_by_id(expense_id)
        if expense is None:
            raise NotFoundError("Gasto no encontrado.")
        self.event_context.require_expense_editor(
            expense.event_id, expense.created_by_member_id, user_id
        )
        try:
            self.expense_repo.soft_delete(expense)
            if self.activity_service:
                actor_name = self.event_context.actor_name(user_id)
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

    def update_receipt(
        self, expense_id: UUID, user_id: str, file_content: bytes, content_type: str | None = None
    ) -> ExpenseReceiptRead:
        raise ValidationError(
            "El comprobante de un gasto es inmutable y no puede ser modificado ni reemplazado."
        )

    def delete_receipt(self, expense_id: UUID, user_id: str) -> None:
        raise ValidationError("El comprobante de un gasto no puede ser eliminado.")

    def analyze_receipt(
        self, event_id: UUID, user_id: str, file_content: bytes, content_type: str | None = None
    ) -> ReceiptAnalysisResponse:
        self.event_context.require_active_member(event_id, user_id)
        if self.receipt_storage is None:
            raise InfrastructureError("Almacenamiento de comprobantes no configurado.")
        stored = self.receipt_storage.upload_receipt(file_content, str(event_id), content_type)
        if self.gemini_analyzer:
            return self.gemini_analyzer.analyze_image_bytes(
                file_content, content_type or "image/jpeg", stored.secure_url, stored.public_id
            )
        return ReceiptAnalysisResponse(
            image_url=stored.secure_url, receipt_public_id=stored.public_id, is_receipt=False
        )

    def discard_temp_receipt(self, event_id: UUID, user_id: str, public_id: str) -> None:
        self.event_context.require_active_member(event_id, user_id)
        if self.receipt_storage is None or not public_id.startswith(
            f"{self.receipt_storage.folder}/{event_id}"
        ):
            return
        try:
            self.receipt_storage.destroy(public_id)
        except Exception:
            pass

    def get_debts_summary(
        self, user_id: str, event_id: UUID | None = None
    ) -> DebtsSummaryRead:
        from sqlmodel import col, desc, select

        from app.modules.payments.models.enums import PaymentStatus
        from app.modules.payments.models.payment import Payment

        # 1. Resolver eventos activos y membresías del usuario a través de ExpenseContextService
        memberships = self.event_context.list_user_active_event_memberships(
            user_id, event_id=event_id
        )
        if not memberships and event_id is not None:
            # Validar que si especificó un evento pero no se encontró, requerir membresía
            self.event_context.require_active_member(event_id, user_id)

        events_by_id = {m.event_id: m.event_name for m in memberships}
        members_by_event = {m.event_id: m.member_id for m in memberships}
        relevant_event_ids = list(events_by_id.keys())

        if not relevant_event_ids:
            return DebtsSummaryRead(
                total_i_owe=Decimal("0.00"),
                total_i_am_owed=Decimal("0.00"),
                debts_to_pay=[],
                debts_to_collect=[],
            )

        # 2. Obtener pagos de todos los splits de los eventos relevantes
        # Primero buscar los gastos activos de esos eventos
        expenses = list(
            self.split_repo.session.exec(
                select(Expense).where(
                    col(Expense.event_id).in_(relevant_event_ids),
                    Expense.deleted_at.is_(None),
                )
            ).all()
        )
        expense_ids = [e.id for e in expenses]
        expenses_by_id = {e.id: e for e in expenses}

        splits = []
        if expense_ids:
            splits = list(
                self.split_repo.session.exec(
                    select(ExpenseSplit).where(
                        col(ExpenseSplit.expense_id).in_(expense_ids),
                        ExpenseSplit.deleted_at.is_(None),
                        ExpenseSplit.assigned_amount > Decimal("0.00"),
                    )
                ).all()
            )

        split_ids = [s.id for s in splits]
        payments_by_split: dict[UUID, Payment] = {}
        if split_ids:
            payments = list(
                self.split_repo.session.exec(
                    select(Payment)
                    .where(
                        col(Payment.split_id).in_(split_ids),
                        Payment.deleted_at.is_(None),
                    )
                    .order_by(desc(Payment.created_at))
                ).all()
            )
            for p in payments:
                if p.split_id not in payments_by_split:
                    payments_by_split[p.split_id] = p
                elif p.status == PaymentStatus.CONFIRMED:
                    payments_by_split[p.split_id] = p

        # 3. Calcular "Lo que debo" (debts_to_pay)
        debts_to_pay: list[DebtToPayItem] = []
        total_i_owe = Decimal("0.00")

        # Agrupar splits por miembro usuario
        for split in splits:
            expense = expenses_by_id.get(split.expense_id)
            if not expense:
                continue
            user_member_id = members_by_event.get(expense.event_id)
            if not user_member_id:
                continue

            # Es una cuota asignada a mí en un gasto que pagó otra persona
            if split.member_id == user_member_id and expense.paid_by_member_id != user_member_id:
                payment = payments_by_split.get(split.id)
                # Si el pago está confirmado, ya está saldado
                if payment and payment.status == PaymentStatus.CONFIRMED:
                    continue

                payment_status = "no_payment"
                payment_id = None
                if payment:
                    payment_status = (
                        payment.status.value
                        if hasattr(payment.status, "value")
                        else str(payment.status)
                    )
                    payment_id = payment.id

                event_name = events_by_id.get(expense.event_id, "Evento")
                payer_name = self.event_context.member_name(expense.paid_by_member_id, "Acreedor")

                debts_to_pay.append(
                    DebtToPayItem(
                        expense_id=expense.id,
                        split_id=split.id,
                        expense_name=expense.name,
                        category=expense.category,
                        event_id=expense.event_id,
                        event_name=event_name,
                        payer_name=payer_name,
                        amount=split.assigned_amount,
                        payment_status=payment_status,
                        payment_id=payment_id,
                    )
                )
                total_i_owe += split.assigned_amount

        # 4. Calcular "Lo que me deben" (debts_to_collect)
        debts_to_collect: list[DebtToCollectItem] = []
        total_i_am_owed = Decimal("0.00")

        splits_by_expense: dict[UUID, list[ExpenseSplit]] = {}
        for s in splits:
            splits_by_expense.setdefault(s.expense_id, []).append(s)

        for expense in expenses:
            user_member_id = members_by_event.get(expense.event_id)
            if not user_member_id:
                continue

            # Yo soy el pagador de este gasto
            if expense.paid_by_member_id == user_member_id:
                expense_splits = splits_by_expense.get(expense.id, [])
                pending_amount = Decimal("0.00")
                unpaid_count = 0
                pending_verification_count = 0

                for s in expense_splits:
                    # Omitir mi propio consumo
                    if s.member_id == user_member_id:
                        continue

                    payment = payments_by_split.get(s.id)
                    if payment and payment.status == PaymentStatus.CONFIRMED:
                        # Ya pagado
                        continue
                    elif payment and payment.status == PaymentStatus.PENDING_CONFIRMATION:
                        pending_verification_count += 1
                        pending_amount += s.assigned_amount
                    else:
                        unpaid_count += 1
                        pending_amount += s.assigned_amount

                if pending_amount > Decimal("0.00"):
                    event_name = events_by_id.get(expense.event_id, "Evento")
                    debts_to_collect.append(
                        DebtToCollectItem(
                            expense_id=expense.id,
                            expense_name=expense.name,
                            category=expense.category,
                            event_id=expense.event_id,
                            event_name=event_name,
                            total_pending_amount=pending_amount,
                            unpaid_count=unpaid_count,
                            pending_verification_count=pending_verification_count,
                        )
                    )
                    total_i_am_owed += pending_amount

        return DebtsSummaryRead(
            total_i_owe=total_i_owe.quantize(CENT),
            total_i_am_owed=total_i_am_owed.quantize(CENT),
            debts_to_pay=debts_to_pay,
            debts_to_collect=debts_to_collect,
        )

