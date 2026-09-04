"""Servicio de sincronización de cuotas (splits) para gastos actualizados."""

from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from app.modules.expenses.models.expense import Expense
from app.modules.expenses.models.expense_split import ExpenseSplit
from app.modules.expenses.repositories.expense_split_repository import ExpenseSplitRepository


class ExpenseSplitSynchronizer:
    """Sincroniza y reutiliza registros de splits evitando colisiones con soft-delete."""

    def __init__(self, split_repo: ExpenseSplitRepository):
        self.split_repo = split_repo

    def sync_splits(
        self, expense: Expense, calculated_splits: list[tuple[UUID, Decimal]]
    ) -> None:
        """Aplica las nuevas cuotas reactivando filas previas o creando nuevas."""
        existing = self.split_repo.list_all_by_expense(expense.id, include_deleted=True)
        by_member = {split.member_id: split for split in existing}
        targets = {member_id for member_id, _ in calculated_splits}

        for member_id, assigned in calculated_splits:
            split = by_member.get(member_id)
            if split is None:
                self.split_repo.create(
                    ExpenseSplit(
                        expense_id=expense.id, member_id=member_id, assigned_amount=assigned
                    )
                )
            else:
                split.assigned_amount = assigned
                split.deleted_at = None
                self.split_repo.update(split)

        for split in existing:
            if split.deleted_at is None and split.member_id not in targets:
                split.deleted_at = datetime.now(UTC)
                self.split_repo.update(split)
