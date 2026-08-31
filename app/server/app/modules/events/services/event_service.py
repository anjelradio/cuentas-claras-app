from uuid import UUID
from datetime import datetime, UTC
from sqlmodel import Session
from app.core.errors import NotFoundError, ForbiddenError, ValidationError
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.schemas.event_schemas import EventCreateRequest, EventUpdateRequest
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.member_repository import MemberRepository

class EventService:
    def __init__(self, session: Session):
        self.session = session
        self.event_repo = EventRepository(session)
        self.member_repo = MemberRepository(session)

    def create_event(self, request: EventCreateRequest, user_id: str) -> Event:
        event = Event(
            name=request.name,
            description=request.description,
            icon=request.icon,
            starts_at=request.starts_at,
            user_id=user_id
        )
        created_event = self.event_repo.create(event)
        
        # Propietario automáticamente se convierte en miembro activo
        member = EventMember(
            event_id=created_event.id,
            user_id=user_id,
            status=MemberStatus.ACTIVE
        )
        self.member_repo.create(member)
        return created_event

    def get_event(self, event_id: UUID, user_id: str) -> Event:
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundError("El evento no existe.")
        
        member = self.member_repo.get_by_event_and_user(event_id, user_id)
        if not member or member.status != MemberStatus.ACTIVE:
            raise ForbiddenError("No eres miembro activo de este evento.")
            
        return event

    def get_event_detail(self, event_id: UUID, user_id: str) -> dict:
        event = self.get_event(event_id, user_id)
        from app.modules.events.models.user_proxy import User
        from sqlmodel import select
        
        owner = self.session.exec(select(User).where(User.id == event.user_id)).first()
        owner_name = owner.name if owner else "Usuario Desconocido"
        
        event_dict = event.model_dump()
        event_dict["owner_name"] = owner_name
        event_dict["is_owner"] = event.user_id == user_id
        return event_dict

    def list_user_events(self, user_id: str) -> list[Event]:
        # Implementation via join
        from sqlmodel import select
        statement = (
            select(Event)
            .join(EventMember, Event.id == EventMember.event_id)
            .where(
                EventMember.user_id == user_id,
                EventMember.status == MemberStatus.ACTIVE,
                Event.deleted_at == None
            )
        )
        return list(self.session.exec(statement).all())

    def update_event(self, event_id: UUID, user_id: str, request: EventUpdateRequest) -> Event:
        event = self.get_event(event_id, user_id)
        if event.user_id != user_id:
            raise ForbiddenError("Solo el propietario puede modificar el evento.")
            
        update_data = request.model_dump(exclude_unset=True)
        
        if event.status == EventStatus.CLOSED:
            allowed_keys = ["status"]
            if any(k not in allowed_keys for k in update_data.keys()):
                raise ValidationError("No se pueden modificar otros campos en un evento cerrado, excepto reabrirlo.")
            if update_data.get("status") != EventStatus.OPEN:
                raise ValidationError("El evento ya está cerrado.")
                
        for key, value in update_data.items():
            setattr(event, key, value)
            
        if "status" in update_data:
            if update_data["status"] == EventStatus.CLOSED:
                event.closed_at = datetime.now(UTC)
            elif update_data["status"] == EventStatus.OPEN:
                event.closed_at = None
            
        return self.event_repo.update(event)

    def delete_event(self, event_id: UUID, user_id: str) -> None:
        event = self.get_event(event_id, user_id)
        if event.user_id != user_id:
            raise ForbiddenError("Solo el propietario puede eliminar el evento.")
            
        active_members = self.member_repo.get_active_members(event_id)
        if len([m for m in active_members if m.user_id != user_id]) > 0:
            raise ValidationError("No se puede eliminar el evento mientras tenga otros miembros activos.")
            
        self.event_repo.soft_delete(event)

    def transfer_ownership(self, event_id: UUID, user_id: str, new_owner_id: str) -> None:
        event = self.get_event(event_id, user_id)
        if event.user_id != user_id:
            raise ForbiddenError("Solo el propietario puede transferir el evento.")
            
        new_owner_member = self.member_repo.get_by_event_and_user(event_id, new_owner_id)
        if not new_owner_member or new_owner_member.status != MemberStatus.ACTIVE:
            raise NotFoundError("El nuevo propietario no es un miembro activo del evento.")
            
        event.user_id = new_owner_id
        self.event_repo.update(event)
