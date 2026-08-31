from datetime import datetime
from sqlmodel import Field
from uuid import UUID
from app.db.base import BaseModel

class EventInvitation(BaseModel, table=True):
    event_id: UUID = Field(foreign_key="event.id")
    token_hash: str = Field(unique=True, index=True)
    expires_at: datetime
