from uuid import UUID
from datetime import datetime, UTC
from sqlmodel import Session, select
from app.modules.events.models.event_invitation import EventInvitation

class InvitationRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, invitation: EventInvitation) -> EventInvitation:
        self.session.add(invitation)
        self.session.commit()
        self.session.refresh(invitation)
        return invitation

    def get_active_by_event(self, event_id: UUID) -> EventInvitation | None:
        statement = select(EventInvitation).where(
            EventInvitation.event_id == event_id,
            EventInvitation.expires_at > datetime.now(UTC),
            EventInvitation.deleted_at == None
        ).order_by(EventInvitation.expires_at.desc())
        return self.session.exec(statement).first()

    def get_by_token(self, token: str) -> EventInvitation | None:
        statement = select(EventInvitation).where(
            EventInvitation.token_hash == token,
            EventInvitation.expires_at > datetime.now(UTC),
            EventInvitation.deleted_at == None
        )
        return self.session.exec(statement).first()
