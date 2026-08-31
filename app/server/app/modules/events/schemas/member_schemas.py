from datetime import datetime

from pydantic import BaseModel, ConfigDict


class JoinEventRequest(BaseModel):
    token_hash: str


class MemberRead(BaseModel):
    user_id: str
    name: str
    email: str
    image: str | None = None
    role: str
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)
