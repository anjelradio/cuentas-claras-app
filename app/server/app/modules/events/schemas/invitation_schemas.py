from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class EventInvitationRead(BaseModel):
    id: UUID
    event_id: UUID
    token_hash: str
    expires_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
