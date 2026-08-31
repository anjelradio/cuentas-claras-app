from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.modules.events.models.enums import EventStatus


class EventBase(BaseModel):
    name: str
    description: str | None = None
    icon: str
    starts_at: datetime
    ends_at: datetime


class EventCreateRequest(EventBase):
    pass


class EventUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    status: EventStatus | None = None


class EventRead(EventBase):
    id: UUID
    status: EventStatus
    closed_at: datetime | None = None
    user_id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class EventSummaryRead(EventBase):
    id: UUID
    status: EventStatus
    member_count: int
    model_config = ConfigDict(from_attributes=True)


class EventDetailRead(EventRead):
    owner_name: str | None = None
    is_owner: bool
    model_config = ConfigDict(from_attributes=True)


class TransferOwnershipRequest(BaseModel):
    new_owner_id: str
