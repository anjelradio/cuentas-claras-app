from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import CheckConstraint, Index, Numeric, String
from sqlmodel import Field

from app.db.base import BaseModel
from app.modules.expenses.models.enums import ExpenseCategory, ExpenseSplitType


class Expense(BaseModel, table=True):
    __table_args__ = (
        CheckConstraint("amount > 0", name="chk_expense_amount_positive"),
        CheckConstraint(
            "refund_amount >= 0 AND refund_amount <= amount",
            name="chk_expense_refund_amount_range",
        ),
        Index("ix_expense_event_id_deleted_at_date", "event_id", "deleted_at", "expense_date"),
    )

    event_id: UUID = Field(foreign_key="event.id", index=True)
    created_by_member_id: UUID = Field(foreign_key="eventmember.id", index=True)
    paid_by_member_id: UUID = Field(foreign_key="eventmember.id", index=True)
    name: str = Field(max_length=100)
    description: str | None = Field(default=None, max_length=500)
    amount: Decimal = Field(sa_type=Numeric(10, 2), nullable=False)
    refund_amount: Decimal = Field(
        default=Decimal("0.00"), sa_type=Numeric(10, 2), nullable=False
    )
    payer_participated: bool = Field(default=True, nullable=False)
    category: ExpenseCategory = Field(sa_type=String(30), nullable=False)
    split_type: ExpenseSplitType = Field(sa_type=String(20), nullable=False)
    expense_date: datetime = Field(nullable=False)
    receipt_url: str | None = Field(default=None, max_length=500)
    receipt_public_id: str | None = Field(default=None, max_length=200)
