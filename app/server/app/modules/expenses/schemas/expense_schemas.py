from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.expenses.models.enums import ExpenseCategory, ExpenseSplitType


class ExpenseSplitRequest(BaseModel):
    member_id: UUID
    assigned_amount: Decimal = Field(ge=Decimal("0.00"))

    model_config = ConfigDict(extra="forbid")


class ExpenseCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    amount: Decimal = Field(gt=Decimal("0.00"))
    category: ExpenseCategory
    split_type: ExpenseSplitType
    payer_participated: bool
    expense_date: datetime
    participant_member_ids: list[UUID] | None = None
    splits: list[ExpenseSplitRequest] | None = None
    receipt_url: str | None = None

    model_config = ConfigDict(extra="forbid")


class ReceiptAnalysisResponse(BaseModel):
    image_url: str
    receipt_public_id: str | None = None
    is_receipt: bool
    name: str | None = None
    description: str | None = None
    amount: Decimal | None = None
    category: ExpenseCategory | None = None
    expense_date: str | None = None


class DiscardReceiptRequest(BaseModel):
    public_id: str


class ExpenseUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    amount: Decimal | None = Field(default=None, gt=Decimal("0.00"))
    category: ExpenseCategory | None = None
    split_type: ExpenseSplitType | None = None
    payer_participated: bool | None = None
    expense_date: datetime | None = None
    participant_member_ids: list[UUID] | None = None
    splits: list[ExpenseSplitRequest] | None = None

    model_config = ConfigDict(extra="forbid")


class ExpenseRead(BaseModel):
    id: UUID
    event_id: UUID
    created_by_member_id: UUID
    paid_by_member_id: UUID
    name: str
    description: str | None = None
    amount: Decimal
    refund_amount: Decimal
    payer_contribution: Decimal
    payer_participated: bool
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
    payment_status: str = "no_payment"
    payment_id: UUID | None = None
    payment_method: str | None = None
    proof_image_url: str | None = None


class ExpenseDetailRead(BaseModel):
    id: UUID
    event_id: UUID
    name: str
    description: str | None = None
    amount: Decimal
    refund_amount: Decimal
    payer_contribution: Decimal
    payer_participated: bool
    category: ExpenseCategory
    split_type: ExpenseSplitType
    expense_date: datetime
    receipt_url: str | None = None
    created_by_member_id: UUID
    created_by_member_name: str
    paid_by_member_id: UUID
    paid_by_member_name: str
    is_payer: bool = False
    current_user_split: ExpenseSplitRead | None = None
    created_at: datetime
    updated_at: datetime
    splits: list[ExpenseSplitRead]


class ExpenseSummaryRead(BaseModel):
    id: UUID
    event_id: UUID
    name: str
    description: str | None = None
    amount: Decimal
    refund_amount: Decimal
    payer_contribution: Decimal
    payer_participated: bool
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


class DebtToPayItem(BaseModel):
    expense_id: UUID
    split_id: UUID
    expense_name: str
    category: ExpenseCategory
    event_id: UUID
    event_name: str
    payer_name: str
    amount: Decimal
    payment_status: str
    payment_id: UUID | None = None


class DebtToCollectItem(BaseModel):
    expense_id: UUID
    expense_name: str
    category: ExpenseCategory
    event_id: UUID
    event_name: str
    total_pending_amount: Decimal
    unpaid_count: int
    pending_verification_count: int


class DebtsSummaryRead(BaseModel):
    total_i_owe: Decimal
    total_i_am_owed: Decimal
    debts_to_pay: list[DebtToPayItem]
    debts_to_collect: list[DebtToCollectItem]

