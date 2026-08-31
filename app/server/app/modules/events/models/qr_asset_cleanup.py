from datetime import datetime
from uuid import UUID

from sqlmodel import Field

from app.db.base import BaseModel


class QrAssetCleanup(BaseModel, table=True):
    """Trabajo persistente para eliminar activos externos sin revertir la BD."""

    event_member_id: UUID = Field(foreign_key="eventmember.id", index=True)
    public_id: str = Field(index=True)
    reason: str
    status: str = Field(default="pending", index=True)
    attempt_count: int = Field(default=0)
    last_attempt_at: datetime | None = None
    last_error_code: str | None = None
