from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActivityRead(BaseModel):
    id: str
    type: str
    actorName: str
    targetName: str | None = None
    createdAt: datetime
    description: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ActivityPaginatedRead(BaseModel):
    items: list[ActivityRead]
    total: int
    has_more: bool
