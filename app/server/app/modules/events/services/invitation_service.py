import secrets
import string
from datetime import UTC, datetime, timedelta
from uuid import UUID

from app.core.config import get_settings
from app.modules.events.models.event_invitation import EventInvitation
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.invitation_repository import InvitationRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.repositories.unit_of_work import EventUnitOfWork
from app.modules.events.services.event_authorization_service import EventAuthorizationService


class InvitationService:
    def __init__(
        self,
        events: EventRepository,
        members: MemberRepository,
        invitations: InvitationRepository,
        uow: EventUnitOfWork,
    ):
        self.invitations, self.uow = invitations, uow
        self.authorization = EventAuthorizationService(events, members)

    def generate_invitation(self, event_id: UUID, user_id: str) -> EventInvitation:
        event, _ = self.authorization.require_owner(event_id, user_id)
        self.authorization.require_open(event)
        existing = self.invitations.get_active_by_event(event_id)
        if existing:
            return existing
        alphabet = string.ascii_letters + string.digits
        token = "".join(secrets.choice(alphabet) for _ in range(6))
        while self.invitations.get_by_token(token):
            token = "".join(secrets.choice(alphabet) for _ in range(6))
        invitation = EventInvitation(
            event_id=event_id,
            token_hash=token,
            expires_at=datetime.now(UTC) + timedelta(days=get_settings().invitation_expire_days),
        )
        try:
            created = self.invitations.create(invitation)
            self.uow.commit()
            return created
        except Exception:
            self.uow.rollback()
            raise
