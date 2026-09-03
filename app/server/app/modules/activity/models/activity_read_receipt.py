from datetime import UTC, datetime
from uuid import UUID
from pydantic import ConfigDict
from sqlmodel import Field, Index, UniqueConstraint

from app.db.base import BaseModel


class ActivityReadReceipt(BaseModel, table=True):
    __tablename__ = "activity_read_receipt"
    __table_args__ = (
        UniqueConstraint("user_id", "activity_id", name="uq_activity_read_receipt_user_activity"),
        Index("ix_activity_read_receipt_user_id", "user_id"),
        Index("ix_activity_read_receipt_activity_id", "activity_id"),
    )

    user_id: str = Field(nullable=False)
    activity_id: UUID = Field(foreign_key="activitylog.id", nullable=False)
    read_at: datetime = Field(default_factory=lambda: datetime.now(UTC), nullable=False)

    model_config = ConfigDict(from_attributes=True)
