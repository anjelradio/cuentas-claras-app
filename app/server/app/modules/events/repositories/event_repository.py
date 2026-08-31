from uuid import UUID

from sqlalchemy import and_, func
from sqlalchemy.orm import aliased
from sqlmodel import Session, select

from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.user_proxy import User


class EventRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, event: Event) -> Event:
        self.session.add(event)
        self.session.flush()
        self.session.refresh(event)
        return event

    def get_by_id(self, event_id: UUID) -> Event | None:
        statement = select(Event).where(Event.id == event_id, Event.deleted_at.is_(None))
        return self.session.exec(statement).first()

    def update(self, event: Event) -> Event:
        self.session.add(event)
        self.session.flush()
        self.session.refresh(event)
        return event

    def soft_delete(self, event: Event) -> None:
        from datetime import UTC, datetime

        event.deleted_at = datetime.now(UTC)
        self.session.add(event)
        self.session.flush()

    def list_for_active_member(
        self, user_id: str, *, active_only: bool = False
    ) -> list[dict[str, object]]:
        counted_member = aliased(EventMember)
        statement = (
            select(Event, func.count(counted_member.id).label("member_count"))
            .join(EventMember, Event.id == EventMember.event_id)
            .outerjoin(
                counted_member,
                and_(
                    Event.id == counted_member.event_id,
                    counted_member.status == MemberStatus.ACTIVE,
                    counted_member.deleted_at.is_(None),
                ),
            )
            .where(
                EventMember.user_id == user_id,
                EventMember.status == MemberStatus.ACTIVE,
                EventMember.deleted_at.is_(None),
                Event.deleted_at.is_(None),
            )
            .group_by(Event.id)
        )
        if active_only:
            statement = statement.where(Event.status == EventStatus.OPEN)

        return [
            {**event.model_dump(), "member_count": int(member_count)}
            for event, member_count in self.session.exec(statement)
        ]

    def owner_name(self, user_id: str) -> str | None:
        return self.session.exec(select(User.name).where(User.id == user_id)).first()
