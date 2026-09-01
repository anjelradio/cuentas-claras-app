from pydantic import ConfigDict
from sqlmodel import Field, Index

from app.db.base import BaseModel


class ActivityLog(BaseModel, table=True):
    __tablename__ = "activitylog"
    __table_args__ = (Index("ix_activitylog_event_id_created_at", "event_id", "created_at"),)

    event_id: str = Field(index=True)
    actor_id: str = Field(index=True)
    actor_name: str
    target_id: str | None = Field(default=None)
    target_name: str | None = Field(default=None)
    action_type: str = Field(index=True)
    description: str | None = Field(default=None)

    model_config = ConfigDict(from_attributes=True)
