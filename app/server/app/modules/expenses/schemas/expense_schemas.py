from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.expenses.models.enums import ExpenseCategory, ExpenseSplitType


class ExpenseSplitRequest(BaseModel):
    member_id: UUID
    assigned_amount: Decimal = Field(ge=Decimal("0.00"))


class ExpenseCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    amount: Decimal = Field(gt=Decimal("0.00"))
    category: ExpenseCategory
    split_type: ExpenseSplitType
    paid_by_member_id: UUID
    expense_date: datetime
    participant_member_ids: list[UUID] | None = None
    splits: list[ExpenseSplitRequest] | None = None


class ExpenseUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    amount: Decimal | None = Field(default=None, gt=Decimal("0.00"))
    category: ExpenseCategory | None = None
    split_type: ExpenseSplitType | None = None
    paid_by_member_id: UUID | None = None
    expense_date: datetime | None = None
    participant_member_ids: list[UUID] | None = None
    splits: list[ExpenseSplitRequest] | None = None


class ExpenseRead(BaseModel):
    id: UUID
    event_id: UUID
    created_by_member_id: UUID
    paid_by_member_id: UUID
    name: str
    description: str | None = None
    amount: Decimal
    category: ExpenseCategory
    split_type: ExpenseSplitType
    expense_date: datetime
    receipt_url: str | None = None
    created_at: datetime
    updated_at: datetime


class ExpenseSplitRead(BaseModel):
    id: UUID
    member_id: UUID
    member_name: str
    assigned_amount: Decimal


class ExpenseDetailRead(BaseModel):
    id: UUID
    event_id: UUID
    name: str
    description: str | None = None
    amount: Decimal
    category: ExpenseCategory
    split_type: ExpenseSplitType
    expense_date: datetime
    receipt_url: str | None = None
    created_by_member_id: UUID
    created_by_member_name: str
    paid_by_member_id: UUID
    paid_by_member_name: str
    created_at: datetime
    updated_at: datetime
    splits: list[ExpenseSplitRead]


class ExpenseSummaryRead(BaseModel):
    id: UUID
    event_id: UUID
    name: str
    description: str | None = None
    amount: Decimal
    category: ExpenseCategory
    split_type: ExpenseSplitType
    expense_date: datetime
    paid_by_member_id: UUID
    paid_by_member_name: str
    has_receipt: bool
    created_at: datetime


class ExpenseReceiptRead(BaseModel):
    expense_id: UUID
    receipt_url: str
