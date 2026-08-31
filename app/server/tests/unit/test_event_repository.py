from datetime import UTC, datetime

from sqlmodel import Session, SQLModel, create_engine

import app.db.models  # noqa: F401
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.repositories.event_repository import EventRepository


def test_list_for_active_member_filters_open_events_and_counts_active_members() -> None:
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    event_open = Event(
        name="Abierto",
        icon="🎉",
        starts_at=datetime(2026, 8, 31, tzinfo=UTC),
        ends_at=datetime(2026, 9, 1, tzinfo=UTC),
        user_id="owner",
    )
    event_closed = Event(
        name="Cerrado",
        icon="📦",
        starts_at=datetime(2026, 8, 31, tzinfo=UTC),
        ends_at=datetime(2026, 8, 31, tzinfo=UTC),
        status=EventStatus.CLOSED,
        user_id="owner",
    )
    with Session(engine) as session:
        session.add_all([event_open, event_closed])
        session.flush()
        session.add_all(
            [
                EventMember(event_id=event_open.id, user_id="owner", status=MemberStatus.ACTIVE),
                EventMember(event_id=event_open.id, user_id="member", status=MemberStatus.ACTIVE),
                EventMember(event_id=event_open.id, user_id="left", status=MemberStatus.LEFT),
                EventMember(event_id=event_closed.id, user_id="owner", status=MemberStatus.ACTIVE),
            ]
        )
        session.commit()

        repository = EventRepository(session)
        all_events = repository.list_for_active_member("owner")
        active_events = repository.list_for_active_member("owner", active_only=True)

    assert {event["name"] for event in all_events} == {"Abierto", "Cerrado"}
    assert active_events[0]["name"] == "Abierto"
    assert active_events[0]["member_count"] == 2
