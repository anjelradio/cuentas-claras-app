from uuid import UUID

from app.core.config import get_settings
from app.core.errors import NotFoundError, ValidationError
from app.modules.activity.services.activity import ActivityService
from app.modules.events.integrations.cloudinary_storage import CloudinaryStorage
from app.modules.events.models.enums import MemberStatus
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.qr_asset_cleanup import QrAssetCleanup
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.invitation_repository import InvitationRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.repositories.qr_asset_cleanup_repository import QrAssetCleanupRepository
from app.modules.events.repositories.unit_of_work import EventUnitOfWork
from app.modules.events.services.event_authorization_service import EventAuthorizationService
from app.modules.events.services.qr_cleanup_service import QrCleanupService


class MemberService:
    def __init__(
        self,
        events: EventRepository,
        members: MemberRepository,
        invitations: InvitationRepository,
        cleanups: QrAssetCleanupRepository,
        uow: EventUnitOfWork,
        storage: CloudinaryStorage | None = None,
        activity_service: ActivityService | None = None,
    ):
        self.events, self.members, self.invitations, self.cleanups, self.uow = (
            events,
            members,
            invitations,
            cleanups,
            uow,
        )
        self.authorization = EventAuthorizationService(events, members)
        self.storage = storage
        self.activity_service = activity_service

    def join_event(self, token_hash: str, user_id: str) -> None:
        invitation = self.invitations.get_by_token(token_hash)
        if invitation is None:
            raise NotFoundError("Invitación inválida o expirada.")
        event = self.events.get_by_id(invitation.event_id)
        if event is None:
            raise NotFoundError("El evento no existe.")
        self.authorization.require_open(event)
        member = self.members.get_by_event_and_user(event.id, user_id)
        if member and member.status == MemberStatus.ACTIVE:
            raise ValidationError("Ya eres miembro de este evento.")
        try:
            if member:
                member.status = MemberStatus.ACTIVE
                self.members.update(member)
            else:
                self.members.create(
                    EventMember(event_id=event.id, user_id=user_id, status=MemberStatus.ACTIVE)
                )

            if self.activity_service:
                actor_name = self.events.owner_name(user_id) or "Usuario"
                self.activity_service.log_activity(
                    event_id=str(event.id),
                    actor_id=user_id,
                    actor_name=actor_name,
                    action_type="member_joined",
                    description=f"{actor_name} se unió al evento.",
                )

            self.uow.commit()
        except Exception:
            self.uow.rollback()
            raise

    def leave_event(self, event_id: UUID, user_id: str) -> str | None:
        event, member = self.authorization.require_active_member(event_id, user_id)
        self.authorization.require_open(event)
        if event.user_id == user_id:
            raise ValidationError(
                "El propietario no puede abandonar el evento. "
                "Debes transferir la propiedad primero."
            )
        public_id = member.qr_image_public_id
        try:
            member.status = MemberStatus.LEFT
            self.members.update_qr(member, None, None)
            if public_id:
                self.cleanups.create(
                    QrAssetCleanup(event_member_id=member.id, public_id=public_id, reason="leave")
                )

            if self.activity_service:
                actor_name = self.events.owner_name(user_id) or "Usuario"
                self.activity_service.log_activity(
                    event_id=str(event.id),
                    actor_id=user_id,
                    actor_name=actor_name,
                    action_type="member_left",
                    description=f"{actor_name} abandonó el evento.",
                )

            self.uow.commit()
            if public_id:
                try:
                    QrCleanupService(
                        self.cleanups, self.storage or CloudinaryStorage(get_settings())
                    ).process_pending()
                except Exception:
                    pass
            return public_id
        except Exception:
            self.uow.rollback()
            raise

    def remove_member(self, event_id: UUID, owner_id: str, member_user_id: str) -> None:
        event, _ = self.authorization.require_owner(event_id, owner_id)
        self.authorization.require_open(event)
        if owner_id == member_user_id:
            raise ValidationError("No puedes eliminarte a ti mismo del evento.")
        member = self.members.get_by_event_and_user(event_id, member_user_id)
        if member is None or member.status != MemberStatus.ACTIVE:
            raise NotFoundError("El usuario no es un miembro activo del evento.")
        try:
            member.status = MemberStatus.REMOVED
            self.members.update(member)

            if self.activity_service:
                actor_name = self.events.owner_name(owner_id) or "Usuario"
                target_name = self.events.owner_name(member_user_id) or "Usuario"
                self.activity_service.log_activity(
                    event_id=str(event.id),
                    actor_id=owner_id,
                    actor_name=actor_name,
                    action_type="member_removed",
                    description=f"{actor_name} expulsó a {target_name}.",
                    target_id=member_user_id,
                    target_name=target_name,
                )

            self.uow.commit()
        except Exception:
            self.uow.rollback()
            raise

    def get_event_members(self, event_id: UUID, user_id: str) -> list[dict]:
        event, _ = self.authorization.require_active_member(event_id, user_id)
        return [
            {
                "id": member.id,
                "user_id": user.id,
                "name": user.name,
                "email": user.email,
                "image": user.image,
                "role": "owner" if user.id == event.user_id else "member",
                "joined_at": member.created_at,
            }
            for member, user in self.members.list_active_with_users(event_id)
        ]
