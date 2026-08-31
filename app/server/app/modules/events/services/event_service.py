from datetime import UTC, datetime
from uuid import UUID

from app.core.errors import ValidationError
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.repositories.unit_of_work import EventUnitOfWork
from app.modules.events.schemas.event_schemas import EventCreateRequest, EventUpdateRequest
from app.modules.events.services.event_authorization_service import EventAuthorizationService


from app.modules.activity.services.activity import ActivityService

class EventService:
    def __init__(self, events: EventRepository, members: MemberRepository, uow: EventUnitOfWork, activity_service: ActivityService = None):
        self.events = events
        self.members = members
        self.uow = uow
        self.activity_service = activity_service
        self.authorization = EventAuthorizationService(events, members)

    def create_event(self, request: EventCreateRequest, user_id: str) -> Event:
        self._validate_date_range(request.starts_at, request.ends_at)
        try:
            event = self.events.create(Event(**request.model_dump(), user_id=user_id))
            self.members.create(
                EventMember(event_id=event.id, user_id=user_id, status=MemberStatus.ACTIVE)
            )
            
            if self.activity_service:
                actor_name = self.events.owner_name(user_id) or "Usuario"
                self.activity_service.log_activity(
                    event_id=str(event.id),
                    actor_id=user_id,
                    actor_name=actor_name,
                    action_type="event_created",
                    description=f'{actor_name} creó el evento "{event.name}".',
                    target_name=event.name
                )
                
            self.uow.commit()
            return event
        except Exception:
            self.uow.rollback()
            raise

    def get_event(self, event_id: UUID, user_id: str) -> Event:
        event, _ = self.authorization.require_active_member(event_id, user_id)
        return event

    def get_event_detail(self, event_id: UUID, user_id: str) -> dict:
        event = self.get_event(event_id, user_id)
        return {
            **event.model_dump(),
            "owner_name": self.events.owner_name(event.user_id),
            "is_owner": event.user_id == user_id,
        }

    def list_user_events(
        self, user_id: str, *, active_only: bool = False
    ) -> list[dict[str, object]]:
        return self.events.list_for_active_member(user_id, active_only=active_only)

    def update_event(self, event_id: UUID, user_id: str, request: EventUpdateRequest) -> Event:
        event, _ = self.authorization.require_owner(event_id, user_id)
        updates = request.model_dump(exclude_unset=True)
        if event.status == EventStatus.CLOSED:
            if set(updates) != {"status"} or updates["status"] != EventStatus.OPEN:
                raise ValidationError(
                    "No se pueden modificar otros campos en un evento cerrado, excepto reabrirlo."
                )
        if "starts_at" in updates or "ends_at" in updates:
            self._validate_date_range(
                updates.get("starts_at", event.starts_at),
                updates.get("ends_at", event.ends_at),
            )
        for field, value in updates.items():
            setattr(event, field, value)
            
        action_type = "event_updated"
        action_desc = f'Se actualizaron los datos del evento "{event.name}".'
        if updates.get("status") == EventStatus.CLOSED:
            event.closed_at = datetime.now(UTC)
            action_type = "event_closed"
            action_desc = f'Se cerró el evento "{event.name}".'
        elif updates.get("status") == EventStatus.OPEN:
            event.closed_at = None
            action_type = "event_updated"
            action_desc = f'Se reabrió el evento "{event.name}".'
            
        try:
            updated = self.events.update(event)
            
            if self.activity_service:
                actor_name = self.events.owner_name(user_id) or "Usuario"
                self.activity_service.log_activity(
                    event_id=str(event.id),
                    actor_id=user_id,
                    actor_name=actor_name,
                    action_type=action_type,
                    description=action_desc,
                    target_name=event.name
                )
                
            self.uow.commit()
            return updated
        except Exception:
            self.uow.rollback()
            raise

    @staticmethod
    def _validate_date_range(starts_at: datetime, ends_at: datetime) -> None:
        if ends_at < starts_at:
            raise ValidationError("La fecha de fin no puede ser anterior a la fecha de inicio.")

    def delete_event(self, event_id: UUID, user_id: str) -> None:
        event, _ = self.authorization.require_owner(event_id, user_id)
        self.authorization.require_open(event)
        if any(member.user_id != user_id for member in self.members.get_active_members(event_id)):
            raise ValidationError(
                "No se puede eliminar el evento mientras tenga otros miembros activos."
            )
        try:
            self.events.soft_delete(event)
            self.uow.commit()
        except Exception:
            self.uow.rollback()
            raise

    def transfer_ownership(self, event_id: UUID, user_id: str, new_owner_id: str) -> None:
        event, _ = self.authorization.require_owner(event_id, user_id)
        self.authorization.require_open(event)
        candidate = self.members.get_by_event_and_user(event_id, new_owner_id)
        if candidate is None or candidate.status != MemberStatus.ACTIVE:
            raise ValidationError("El nuevo propietario debe ser un miembro activo del evento.")
        try:
            event.user_id = new_owner_id
            self.events.update(event)
            
            if self.activity_service:
                actor_name = self.events.owner_name(user_id) or "Usuario"
                target_name = self.events.owner_name(new_owner_id) or "Usuario"
                self.activity_service.log_activity(
                    event_id=str(event.id),
                    actor_id=user_id,
                    actor_name=actor_name,
                    action_type="owner_transferred",
                    description=f'{actor_name} transfirió la administración a {target_name}.',
                    target_id=new_owner_id,
                    target_name=target_name
                )
                
            self.uow.commit()
        except Exception:
            self.uow.rollback()
            raise
