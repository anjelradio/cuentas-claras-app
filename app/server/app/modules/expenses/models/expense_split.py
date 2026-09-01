from decimal import Decimal
from uuid import UUID

from sqlalchemy import CheckConstraint, Numeric, UniqueConstraint
from sqlmodel import Field

from app.db.base import BaseModel


class ExpenseSplit(BaseModel, table=True):
    __table_args__ = (
        UniqueConstraint("expense_id", "member_id", name="uq_expense_split_member"),
        CheckConstraint("assigned_amount >= 0", name="chk_expense_split_amount_non_negative"),
    )

    expense_id: UUID = Field(foreign_key="expense.id", index=True)
    member_id: UUID = Field(foreign_key="eventmember.id", index=True)
    assigned_amount: Decimal = Field(sa_type=Numeric(10, 2), nullable=False)
