from datetime import datetime
from uuid import UUID

from sqlalchemy import String
from sqlmodel import Field

from app.db.base import BaseModel
from app.modules.payments.models.enums import PaymentMethod, PaymentStatus


class Payment(BaseModel, table=True):
    __tablename__ = "payment"

    split_id: UUID = Field(foreign_key="expensesplit.id", index=True, nullable=False)
    payment_method: PaymentMethod = Field(
        sa_type=String(20),
        nullable=False,
    )
    status: PaymentStatus = Field(
        default=PaymentStatus.PENDING_CONFIRMATION,
        sa_type=String(30),
        nullable=False,
        index=True,
    )
    proof_image_url: str | None = Field(
        default=None,
        sa_type=String(500),
        nullable=True,
    )
    proof_image_public_id: str | None = Field(
        default=None,
        sa_type=String(255),
        nullable=True,
    )
    confirmed_at: datetime | None = Field(
        default=None,
        nullable=True,
    )
    rejection_reason: str | None = Field(
        default=None,
        sa_type=String(500),
        nullable=True,
    )
