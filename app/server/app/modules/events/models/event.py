from datetime import datetime
from sqlmodel import Field
from app.db.base import BaseModel
from app.modules.events.models.enums import EventStatus

class Event(BaseModel, table=True):
    name: str
    description: str | None = None
    icon: str
    starts_at: datetime
    status: EventStatus = Field(default=EventStatus.OPEN)
    closed_at: datetime | None = None
    user_id: str = Field(foreign_key="user.id")
