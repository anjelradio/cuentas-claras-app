"""Servicio de cálculo y agregación de deudas y balances para gastos."""

from decimal import Decimal
from uuid import UUID

from app.modules.events.services.expense_context_service import ExpenseContextService
from app.modules.expenses.domain.split_calculator import CENT
from app.modules.expenses.models.expense_split import ExpenseSplit
from app.modules.expenses.repositories.expense_repository import ExpenseRepository
from app.modules.expenses.repositories.expense_split_repository import ExpenseSplitRepository
from app.modules.expenses.schemas.expense_schemas import (
    DebtsSummaryRead,
    DebtToCollectItem,
    DebtToPayItem,
)
from app.modules.payments.models.enums import PaymentStatus
from app.modules.payments.models.payment import Payment
from app.modules.payments.repositories.payment_repository import PaymentRepository


class ExpenseDebtsService:
    """Calcula balances de deudas por pagar y por cobrar entre participantes de eventos."""

    def __init__(
        self,
        expense_repo: ExpenseRepository,
        split_repo: ExpenseSplitRepository,
        event_context: ExpenseContextService,
        payment_repo: PaymentRepository | None = None,
    ):
        self.expense_repo = expense_repo
        self.split_repo = split_repo
        self.event_context = event_context
        self.payment_repo = payment_repo or PaymentRepository(split_repo.session)

    def get_debts_summary(
        self, user_id: str, event_id: UUID | None = None
    ) -> DebtsSummaryRead:
        """Obtiene el resumen consolidado de deudas por cobrar y por pagar."""
        # 1. Resolver eventos activos y membresías del usuario
        memberships = self.event_context.list_user_active_event_memberships(
            user_id, event_id=event_id
        )
        if not memberships and event_id is not None:
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

        # 2. Obtener gastos activos y cuotas mediante repositorios (sin SQL en capa de servicio)
        expenses = self.expense_repo.list_by_event_ids(relevant_event_ids)
        expense_ids = [e.id for e in expenses]
        expenses_by_id = {e.id: e for e in expenses}

        splits: list[ExpenseSplit] = []
        if expense_ids:
            splits = self.split_repo.list_active_by_expense_ids(expense_ids)

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

        # Cache local de nombres de miembros para evitar consultas repetitivas N+1
        member_names_cache: dict[UUID, str] = {}

        def get_member_name(member_id: UUID, fallback: str = "Acreedor") -> str:
            if member_id not in member_names_cache:
                member_names_cache[member_id] = self.event_context.member_name(member_id, fallback)
            return member_names_cache[member_id]

        # 3. Calcular "Lo que debo" (debts_to_pay)
        debts_to_pay: list[DebtToPayItem] = []
        total_i_owe = Decimal("0.00")

        for split in splits:
            expense = expenses_by_id.get(split.expense_id)
            if not expense:
                continue
            user_member_id = members_by_event.get(expense.event_id)
            if not user_member_id:
                continue

            if split.member_id == user_member_id and expense.paid_by_member_id != user_member_id:
                payment = payments_by_split.get(split.id)
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
                payer_name = get_member_name(expense.paid_by_member_id, "Acreedor")

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

            if expense.paid_by_member_id == user_member_id:
                expense_splits = splits_by_expense.get(expense.id, [])
                pending_amount = Decimal("0.00")
                unpaid_count = 0
                pending_verification_count = 0

                for s in expense_splits:
                    if s.member_id == user_member_id:
                        continue

                    payment = payments_by_split.get(s.id)
                    if payment and payment.status == PaymentStatus.CONFIRMED:
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
