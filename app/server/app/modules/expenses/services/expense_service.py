"""Casos de uso financieros y orquestación del módulo Expenses."""

from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from app.core.errors import InfrastructureError, NotFoundError, ValidationError
from app.modules.activity.services.activity import ActivityService
from app.modules.events.services.expense_context_service import ExpenseContextService
from app.modules.expenses.domain.split_calculator import CENT, ExpenseSplitCalculator
from app.modules.expenses.integrations.gemini_analyzer import GeminiReceiptAnalyzer
from app.modules.expenses.integrations.receipt_storage import ExpenseReceiptStorage
from app.modules.expenses.models.enums import ExpenseSplitType
from app.modules.expenses.models.expense import Expense
from app.modules.expenses.models.expense_split import ExpenseSplit
from app.modules.expenses.repositories.expense_repository import ExpenseRepository
from app.modules.expenses.repositories.expense_split_repository import ExpenseSplitRepository
from app.modules.expenses.repositories.unit_of_work import ExpenseUnitOfWork
from app.modules.expenses.schemas.expense_schemas import (
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
from app.modules.expenses.services.expense_debts_service import ExpenseDebtsService
from app.modules.expenses.services.expense_receipt_coordinator import ExpenseReceiptCoordinator
from app.modules.expenses.services.expense_split_sync import ExpenseSplitSynchronizer
from app.modules.payments.repositories.payment_repository import PaymentRepository


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
        payment_repo: PaymentRepository | None = None,
    ):
        self.expense_repo = expense_repo
        self.split_repo = split_repo
        self.uow = uow
        self.event_context = event_context
        self.activity_service = activity_service
        self.receipt_storage = receipt_storage
        self.gemini_analyzer = gemini_analyzer
        self.payment_repo = payment_repo or PaymentRepository(split_repo.session)

        # Componentes modulares especializados
        self.receipt_coordinator = ExpenseReceiptCoordinator(receipt_storage)
        self.split_synchronizer = ExpenseSplitSynchronizer(split_repo)
        self.debts_service = ExpenseDebtsService(
            self.expense_repo, self.split_repo, event_context, self.payment_repo
        )

    # --- Métodos de delegación de cálculo de dominio ---

    @classmethod
    def calculate_equal_distribution(
        cls,
        amount: Decimal,
        other_member_ids: list[UUID],
        payer_member_id: UUID,
        payer_participated: bool,
    ) -> tuple[list[tuple[UUID, Decimal]], Decimal]:
        return ExpenseSplitCalculator.calculate_equal_distribution(
            amount, other_member_ids, payer_member_id, payer_participated
        )

    @classmethod
    def calculate_equal_splits(
        cls, amount: Decimal, member_ids: list[UUID]
    ) -> list[tuple[UUID, Decimal]]:
        return ExpenseSplitCalculator.calculate_equal_splits(amount, member_ids)

    @classmethod
    def calculate_exact_distribution(
        cls,
        amount: Decimal,
        splits_input: list[ExpenseSplitRequest] | list[tuple[UUID, Decimal]],
        payer_member_id: UUID,
        payer_participated: bool,
    ) -> tuple[list[tuple[UUID, Decimal]], Decimal]:
        return ExpenseSplitCalculator.calculate_exact_distribution(
            amount, splits_input, payer_member_id, payer_participated
        )

    @staticmethod
    def validate_exact_splits(
        amount: Decimal, splits_input: list[tuple[UUID, Decimal]] | list[ExpenseSplitRequest]
    ) -> list[tuple[UUID, Decimal]]:
        return ExpenseSplitCalculator.validate_exact_splits(amount, splits_input)

    # --- Validaciones y mapeos internos ---

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

    # --- Casos de uso de gestión de gastos ---

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

        receipt_url, uploaded_receipt_public_id = self.receipt_coordinator.upload_if_present(
            receipt_file, event_id, fallback_url=request.receipt_url
        )

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

            splits = [
                ExpenseSplit(
                    expense_id=expense.id,
                    member_id=member_id,
                    assigned_amount=assigned_amount,
                )
                for member_id, assigned_amount in calculated_splits
            ]
            self.split_repo.create_all(splits)

            if self.activity_service:
                actor_name = self.event_context.actor_name(user_id)
                self.activity_service.log_activity(
                    event_id=str(event_id),
                    actor_id=user_id,
                    actor_name=actor_name,
                    action_type="expense_created",
                    description=f'{actor_name} registró el gasto "{expense.name}".',
                    target_id=str(expense.id),
                    target_name=expense.name,
                )

            self.uow.commit()
            return self._expense_read(expense)
        except Exception:
            self.uow.rollback()
            self.receipt_coordinator.compensate_on_rollback(uploaded_receipt_public_id)
            raise

    def list_event_expenses(
        self, event_id: UUID, user_id: str, filter_type: str = "all"
    ) -> list[ExpenseSummaryRead]:
        context = self.event_context.require_active_member(event_id, user_id)
        current_member_id = context.current_member.id

        all_expenses = self.expense_repo.list_by_event(event_id)
        summaries: list[ExpenseSummaryRead] = []

        for expense in all_expenses:
            splits = self.split_repo.list_active_by_expense(expense.id)
            user_split = next((s for s in splits if s.member_id == current_member_id), None)
            is_payer = expense.paid_by_member_id == current_member_id
            user_involved = is_payer or (user_split is not None)

            if filter_type == "mine" and not user_involved:
                continue
            if filter_type == "others" and user_involved:
                continue
            if filter_type not in ("all", "mine", "others"):
                raise ValidationError("Filtro de gastos no válido. Use all, mine u others.")

            paid_by_name = self.event_context.member_name(expense.paid_by_member_id, "Miembro")

            summaries.append(
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
                    paid_by_member_name=paid_by_name,
                    has_receipt=expense.receipt_url is not None,
                    created_at=expense.created_at,
                )
            )

        return summaries

    def get_expense_detail(self, expense_id: UUID, user_id: str) -> ExpenseDetailRead:
        from app.modules.payments.models.enums import PaymentStatus
        from app.modules.payments.models.payment import Payment

        expense = self.expense_repo.get_by_id(expense_id)
        if not expense:
            raise NotFoundError("El gasto solicitado no existe.")

        context = self.event_context.require_active_member(expense.event_id, user_id)
        is_payer = expense.paid_by_member_id == context.current_member.id

        splits = self.split_repo.list_active_by_expense(expense.id)
        splits_read: list[ExpenseSplitRead] = []
        current_user_split: ExpenseSplitRead | None = None

        split_ids = [s.id for s in splits]
        payments_by_split: dict[UUID, Payment] = {}
        if split_ids:
            payments = self.payment_repo.list_by_split_ids(split_ids)
            latest_payments: dict[UUID, Payment] = {}
            confirmed_payments: dict[UUID, Payment] = {}
            for p in payments:
                if p.split_id not in latest_payments:
                    latest_payments[p.split_id] = p
                if p.status == PaymentStatus.CONFIRMED and p.split_id not in confirmed_payments:
                    confirmed_payments[p.split_id] = p
            payments_by_split = {**latest_payments, **confirmed_payments}

        for split in splits:
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

    def update_expense(
        self,
        expense_id: UUID,
        user_id: str,
        request: ExpenseUpdateRequest,
        receipt_file: tuple[bytes, str] | None = None,
    ) -> ExpenseDetailRead:
        expense = self.expense_repo.get_by_id(expense_id)
        if not expense:
            raise NotFoundError("El gasto solicitado no existe.")

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
                self.split_synchronizer.sync_splits(expense, calculated)

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
            if uploaded_receipt_public_id and old_receipt_public_id:
                self.receipt_coordinator.destroy_safely(old_receipt_public_id)

            return self.get_expense_detail(expense.id, user_id)
        except Exception:
            self.uow.rollback()
            self.receipt_coordinator.compensate_on_rollback(uploaded_receipt_public_id)
            raise

    def delete_expense(self, expense_id: UUID, user_id: str) -> None:
        expense = self.expense_repo.get_by_id(expense_id)
        if not expense:
            raise NotFoundError("El gasto solicitado no existe.")

        self.event_context.require_expense_editor(
            expense.event_id, expense.created_by_member_id, user_id
        )

        try:
            active_splits = self.split_repo.list_active_by_expense(expense.id)
            now = datetime.now(UTC)
            for split in active_splits:
                split.deleted_at = now
            self.split_repo.update_all(active_splits)
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
        self.receipt_coordinator.destroy_safely(public_id)

    def get_debts_summary(
        self, user_id: str, event_id: UUID | None = None
    ) -> DebtsSummaryRead:
        return self.debts_service.get_debts_summary(user_id, event_id=event_id)
