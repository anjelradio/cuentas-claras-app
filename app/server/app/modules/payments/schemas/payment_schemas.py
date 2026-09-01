from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.payments.models.enums import PaymentMethod, PaymentStatus


class PaymentCreateRequest(BaseModel):
    payment_method: PaymentMethod

    model_config = ConfigDict(extra="forbid")


class PaymentConfirmRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")


class PaymentRejectRequest(BaseModel):
    rejection_reason: str | None = Field(default=None, max_length=500)

    model_config = ConfigDict(extra="forbid")


class PaymentRead(BaseModel):
    id: UUID
    split_id: UUID
    expense_id: UUID
    debtor_member_id: UUID
    debtor_name: str
    amount: Decimal
    payment_method: PaymentMethod
    status: PaymentStatus
    proof_image_url: str | None = None
    created_at: datetime
    confirmed_at: datetime | None = None
    rejection_reason: str | None = None


class PaymentResolutionRead(BaseModel):
    id: UUID
    split_id: UUID
    status: PaymentStatus
    confirmed_at: datetime | None = None
    rejection_reason: str | None = None


class PayerQrRead(BaseModel):
    payer_member_id: UUID
    payer_name: str
    has_qr: bool
    qr_image_url: str | None = None


class PendingVerificationPaymentRead(BaseModel):
    payment_id: UUID
    split_id: UUID
    expense_id: UUID
    expense_name: str
    event_id: UUID
    event_name: str
    debtor_name: str
    amount: Decimal
    payment_method: PaymentMethod
    created_at: datetime


