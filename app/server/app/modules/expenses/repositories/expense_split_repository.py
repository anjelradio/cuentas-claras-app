from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlmodel import Session, col, select

from app.modules.expenses.models.expense_split import ExpenseSplit


class ExpenseSplitRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, split: ExpenseSplit) -> ExpenseSplit:
        self.session.add(split)
        self.session.flush()
        return split

    def create_all(self, splits: list[ExpenseSplit]) -> list[ExpenseSplit]:
        if not splits:
            return []
        self.session.add_all(splits)
        self.session.flush()
        return splits

    def list_active_by_expense(self, expense_id: UUID) -> list[ExpenseSplit]:
        query = select(ExpenseSplit).where(
            ExpenseSplit.expense_id == expense_id,
            ExpenseSplit.deleted_at.is_(None),
        )
        return list(self.session.exec(query).all())

    def list_active_by_expense_ids(self, expense_ids: list[UUID]) -> list[ExpenseSplit]:
        if not expense_ids:
            return []
        query = select(ExpenseSplit).where(
            col(ExpenseSplit.expense_id).in_(expense_ids),
            ExpenseSplit.deleted_at.is_(None),
            ExpenseSplit.assigned_amount > Decimal("0.00"),
        )
        return list(self.session.exec(query).all())

    def list_all_by_expense(
        self, expense_id: UUID, *, include_deleted: bool = True
    ) -> list[ExpenseSplit]:
        query = select(ExpenseSplit).where(ExpenseSplit.expense_id == expense_id)
        if not include_deleted:
            query = query.where(ExpenseSplit.deleted_at.is_(None))
        return list(self.session.exec(query).all())

    def update(self, split: ExpenseSplit) -> ExpenseSplit:
        split.updated_at = datetime.now(UTC)
        self.session.add(split)
        self.session.flush()
        return split

    def update_all(self, splits: list[ExpenseSplit]) -> list[ExpenseSplit]:
        if not splits:
            return []
        now = datetime.now(UTC)
        for split in splits:
            split.updated_at = now
            self.session.add(split)
        self.session.flush()
        return splits
