from uuid import UUID

from app.core.errors import ForbiddenError, NotFoundError, ValidationError
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.member_repository import MemberRepository


class EventAuthorizationService:
    """Resuelve autorización contextual con el estado vigente de persistencia."""

    def __init__(self, events: EventRepository, members: MemberRepository):
        self.events = events
        self.members = members

    def require_active_member(self, event_id: UUID, user_id: str):
        event = self.events.get_by_id(event_id)
        if event is None:
            raise NotFoundError("El evento no existe.")
        member = self.members.get_by_event_and_user(event_id, user_id)
        if member is None or member.status != MemberStatus.ACTIVE:
            raise ForbiddenError("No eres miembro activo de este evento.")
        return event, member

    def require_owner(self, event_id: UUID, user_id: str):
        event, member = self.require_active_member(event_id, user_id)
        if event.user_id != user_id:
            raise ForbiddenError("Solo el propietario puede realizar esta operación.")
        return event, member

    @staticmethod
    def require_open(event) -> None:
        if event.status != EventStatus.OPEN:
            raise ValidationError("No se puede realizar esta operación en un evento cerrado.")
