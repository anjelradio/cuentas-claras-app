from uuid import UUID
from sqlmodel import Session, select
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.enums import MemberStatus

class MemberRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, member: EventMember) -> EventMember:
        self.session.add(member)
        self.session.commit()
        self.session.refresh(member)
        return member

    def get_by_event_and_user(self, event_id: UUID, user_id: str) -> EventMember | None:
        statement = select(EventMember).where(
            EventMember.event_id == event_id,
            EventMember.user_id == user_id,
            EventMember.deleted_at == None
        )
        return self.session.exec(statement).first()

    def get_active_members(self, event_id: UUID) -> list[EventMember]:
        statement = select(EventMember).where(
            EventMember.event_id == event_id,
            EventMember.status == MemberStatus.ACTIVE,
            EventMember.deleted_at == None
        )
        return list(self.session.exec(statement).all())

    def update(self, member: EventMember) -> EventMember:
        self.session.add(member)
        self.session.commit()
        self.session.refresh(member)
        return member
