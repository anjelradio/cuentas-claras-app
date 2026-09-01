from datetime import UTC, datetime
from uuid import UUID

from sqlmodel import Session, select

from app.modules.expenses.models.expense import Expense


class ExpenseRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, expense: Expense) -> Expense:
        self.session.add(expense)
        self.session.flush()
        return expense

    def get_by_id(self, expense_id: UUID, *, include_deleted: bool = False) -> Expense | None:
        query = select(Expense).where(Expense.id == expense_id)
        if not include_deleted:
            query = query.where(Expense.deleted_at.is_(None))
        return self.session.exec(query).first()

    def update(self, expense: Expense) -> Expense:
        expense.updated_at = datetime.now(UTC)
        self.session.add(expense)
        self.session.flush()
        return expense

    def soft_delete(self, expense: Expense) -> Expense:
        expense.deleted_at = datetime.now(UTC)
        expense.updated_at = datetime.now(UTC)
        self.session.add(expense)
        self.session.flush()
        return expense

    def list_by_event(self, event_id: UUID) -> list[Expense]:
        query = (
            select(Expense)
            .where(Expense.event_id == event_id, Expense.deleted_at.is_(None))
            .order_by(Expense.expense_date.desc(), Expense.created_at.desc())
        )
        return list(self.session.exec(query).all())
