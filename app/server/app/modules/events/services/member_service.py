from uuid import UUID
from sqlmodel import Session
from app.core.errors import NotFoundError, ForbiddenError, ValidationError
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.enums import MemberStatus, EventStatus
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.repositories.invitation_repository import InvitationRepository
from app.modules.events.services.event_service import EventService

class MemberService:
    def __init__(self, session: Session):
        self.session = session
        self.member_repo = MemberRepository(session)
        self.invitation_repo = InvitationRepository(session)
        self.event_service = EventService(session)

    def join_event(self, token_hash: str, user_id: str) -> None:
        invitation = self.invitation_repo.get_by_token(token_hash)
        if not invitation:
            raise NotFoundError("Invitación inválida o expirada.")

        event = self.event_service.event_repo.get_by_id(invitation.event_id)
        if not event or event.status == EventStatus.CLOSED:
            raise ValidationError("El evento no existe o está cerrado.")

        member = self.member_repo.get_by_event_and_user(invitation.event_id, user_id)
        if member:
            if member.status == MemberStatus.ACTIVE:
                raise ValidationError("Ya eres miembro de este evento.")
            else:
                member.status = MemberStatus.ACTIVE
                self.member_repo.update(member)
        else:
            new_member = EventMember(
                event_id=invitation.event_id,
                user_id=user_id,
                status=MemberStatus.ACTIVE
            )
            self.member_repo.create(new_member)

    def leave_event(self, event_id: UUID, user_id: str) -> None:
        event = self.event_service.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundError("El evento no existe.")

        if event.user_id == user_id:
            raise ValidationError("El propietario no puede abandonar el evento. Debes transferir la propiedad primero.")

        member = self.member_repo.get_by_event_and_user(event_id, user_id)
        if not member or member.status != MemberStatus.ACTIVE:
            raise NotFoundError("No eres miembro activo de este evento.")

        member.status = MemberStatus.LEFT
        self.member_repo.update(member)

    def remove_member(self, event_id: UUID, owner_id: str, member_user_id: str) -> None:
        event = self.event_service.get_event(event_id, owner_id)
        if event.user_id != owner_id:
            raise ForbiddenError("Solo el propietario puede eliminar miembros.")

        if owner_id == member_user_id:
            raise ValidationError("No puedes eliminarte a ti mismo del evento.")

        member = self.member_repo.get_by_event_and_user(event_id, member_user_id)
        if not member or member.status != MemberStatus.ACTIVE:
            raise NotFoundError("El usuario no es un miembro activo del evento.")

        member.status = MemberStatus.REMOVED
        self.member_repo.update(member)

    def get_event_members(self, event_id: UUID, user_id: str) -> list[dict]:
        from sqlmodel import select
        from app.modules.events.models.event import Event
        from app.modules.events.models.event_member import EventMember
        from app.modules.events.models.user_proxy import User
        
        # Verify requester is active member
        member = self.member_repo.get_by_event_and_user(event_id, user_id)
        if not member or member.status != MemberStatus.ACTIVE:
            raise ForbiddenError("No eres miembro activo de este evento.")
            
        event = self.session.exec(select(Event).where(Event.id == event_id)).first()
        if not event:
            raise NotFoundError("El evento no existe.")
            
        # Get active members and join with User
        statement = (
            select(EventMember, User)
            .join(User, EventMember.user_id == User.id)
            .where(
                EventMember.event_id == event_id,
                EventMember.status == MemberStatus.ACTIVE
            )
        )
        
        results = self.session.exec(statement).all()
        
        members_data = []
        for em, u in results:
            role = "owner" if u.id == event.user_id else "member"
            members_data.append({
                "user_id": u.id,
                "name": u.name,
                "email": u.email,
                "image": u.image,
                "role": role,
                "joined_at": em.created_at
            })
            
        return members_data
