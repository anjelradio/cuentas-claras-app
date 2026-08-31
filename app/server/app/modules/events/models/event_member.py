from uuid import UUID

from sqlmodel import Field, UniqueConstraint

from app.db.base import BaseModel
from app.modules.events.models.enums import MemberStatus


class EventMember(BaseModel, table=True):
    __table_args__ = (UniqueConstraint("event_id", "user_id", name="uq_event_member"),)

    event_id: UUID = Field(foreign_key="event.id")
    user_id: str = Field(foreign_key="user.id")
    status: MemberStatus = Field(default=MemberStatus.ACTIVE)
    qr_image: str | None = None
    qr_image_public_id: str | None = None
