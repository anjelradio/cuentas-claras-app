"""Registro canónico de modelos SQLModel para que Alembic cargue su metadata."""

from sqlmodel import SQLModel

# Los modelos persistentes de módulos futuros se importan aquí antes de migrar.
from app.modules.events.models.user_proxy import User
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.event_invitation import EventInvitation

__all__ = ["SQLModel", "User", "EventStatus", "MemberStatus", "Event", "EventMember", "EventInvitation"]
