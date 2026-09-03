from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class NotificationRead(BaseModel):
    id: UUID
    event_id: str
    actor_id: str
    actor_name: str
    target_id: str | None = None
    target_name: str | None = None
    action_type: str
    title: str
    description: str
    target_path: str
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    items: list[NotificationRead]
    unread_count: int
    total: int


class UnreadCountResponse(BaseModel):
    unread_count: int


class BatchReadResponse(BaseModel):
    marked_count: int
    status: str = "ok"
