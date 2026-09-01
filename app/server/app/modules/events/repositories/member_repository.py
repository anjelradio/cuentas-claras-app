from uuid import UUID

from sqlmodel import Session, select

from app.modules.events.models.enums import MemberStatus
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.user_proxy import User


class MemberRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, member: EventMember) -> EventMember:
        self.session.add(member)
        self.session.flush()
        self.session.refresh(member)
        return member

    def get_by_id(self, member_id: UUID) -> EventMember | None:
        statement = select(EventMember).where(
            EventMember.id == member_id,
            EventMember.deleted_at.is_(None),
        )
        return self.session.exec(statement).first()

    def get_by_event_and_user(self, event_id: UUID, user_id: str) -> EventMember | None:
        statement = select(EventMember).where(
            EventMember.event_id == event_id,
            EventMember.user_id == user_id,
            EventMember.deleted_at.is_(None),
        )
        return self.session.exec(statement).first()

    def get_active_members(self, event_id: UUID) -> list[EventMember]:
        statement = select(EventMember).where(
            EventMember.event_id == event_id,
            EventMember.status == MemberStatus.ACTIVE,
            EventMember.deleted_at.is_(None),
        )
        return list(self.session.exec(statement).all())

    def update(self, member: EventMember) -> EventMember:
        self.session.add(member)
        self.session.flush()
        self.session.refresh(member)
        return member

    def update_qr(
        self, member: EventMember, image_url: str | None, public_id: str | None
    ) -> EventMember:
        member.qr_image = image_url
        member.qr_image_public_id = public_id
        return self.update(member)

    def list_active_with_users(self, event_id: UUID) -> list[tuple[EventMember, User]]:
        statement = (
            select(EventMember, User)
            .join(User, EventMember.user_id == User.id)
            .where(EventMember.event_id == event_id, EventMember.status == MemberStatus.ACTIVE)
        )
        return list(self.session.exec(statement))
