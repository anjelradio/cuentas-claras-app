from uuid import uuid4

import pytest
from sqlmodel import Session, SQLModel, create_engine

import app.db.models  # noqa: F401 - ensures all models are registered
from app.modules.activity.models.activity import ActivityLog
from app.modules.activity.repositories.notification_repository import NotificationRepository
from app.modules.events.models.enums import MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember


@pytest.fixture
def session():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


from datetime import datetime, UTC

def _create_event(session: Session, event_id, creator_id="carlos"):
    event = Event(
        id=event_id,
        name="Viaje",
        icon="plane",
        starts_at=datetime.now(UTC),
        ends_at=datetime.now(UTC),
        user_id=creator_id,
    )
    session.add(event)
    return event


def test_get_user_notifications_empty_when_not_member(session: Session):
    repo = NotificationRepository(session)
    items, total, unread = repo.get_user_notifications("user-without-events")
    assert items == []
    assert total == 0
    assert unread == 0
    assert repo.get_unread_count("user-without-events") == 0


def test_get_user_notifications_excludes_self_actions_and_calculates_read(session: Session):
    event_id = uuid4()
    # Create event and membership for Ana and Carlos
    _create_event(session, event_id, creator_id="carlos")
    session.add(EventMember(event_id=event_id, user_id="carlos", status=MemberStatus.ACTIVE))
    session.add(EventMember(event_id=event_id, user_id="ana", status=MemberStatus.ACTIVE))

    # Carlos creates an expense activity
    act1 = ActivityLog(
        id=uuid4(),
        event_id=str(event_id),
        actor_id="carlos",
        actor_name="Carlos Ruiz",
        action_type="expense.created",
        description="Carlos registró un gasto de Bs. 100",
    )
    # Ana logs a payment activity
    act2 = ActivityLog(
        id=uuid4(),
        event_id=str(event_id),
        actor_id="ana",
        actor_name="Ana López",
        target_id="carlos",
        target_name="Carlos Ruiz",
        action_type="payment.submitted",
        description="Ana registró un pago hacia Carlos",
    )
    session.add(act1)
    session.add(act2)
    session.commit()

    repo = NotificationRepository(session)

    # Carlos should only see Ana's activity (act2), NOT his own (act1)
    carlos_items, carlos_total, carlos_unread = repo.get_user_notifications("carlos")
    assert carlos_total == 1
    assert carlos_unread == 1
    assert carlos_items[0]["activity"].id == act2.id
    assert carlos_items[0]["is_read"] is False

    # Ana should only see Carlos's activity (act1), NOT her own (act2)
    ana_items, ana_total, ana_unread = repo.get_user_notifications("ana")
    assert ana_total == 1
    assert ana_unread == 1
    assert ana_items[0]["activity"].id == act1.id
    assert ana_items[0]["is_read"] is False


def test_mark_as_read_individual_and_idempotent(session: Session):
    event_id = uuid4()
    _create_event(session, event_id, creator_id="carlos")
    session.add(EventMember(event_id=event_id, user_id="carlos", status=MemberStatus.ACTIVE))
    session.add(EventMember(event_id=event_id, user_id="ana", status=MemberStatus.ACTIVE))

    act = ActivityLog(
        id=uuid4(),
        event_id=str(event_id),
        actor_id="carlos",
        actor_name="Carlos",
        action_type="expense.created",
        description="Gasto",
    )
    session.add(act)
    session.commit()

    repo = NotificationRepository(session)

    assert repo.get_unread_count("ana") == 1

    # Mark as read
    data, success = repo.mark_as_read("ana", act.id)
    assert success is True
    assert data["is_read"] is True
    assert data["read_at"] is not None

    # Unread count should now be 0
    assert repo.get_unread_count("ana") == 0

    # Repeating mark as read should be idempotent
    data2, success2 = repo.mark_as_read("ana", act.id)
    assert success2 is True
    assert data2["is_read"] is True


def test_mark_all_as_read_batch(session: Session):
    event_id = uuid4()
    _create_event(session, event_id, creator_id="carlos")
    session.add(EventMember(event_id=event_id, user_id="carlos", status=MemberStatus.ACTIVE))
    session.add(EventMember(event_id=event_id, user_id="ana", status=MemberStatus.ACTIVE))

    # Add 3 activities created by Carlos
    for i in range(3):
        session.add(
            ActivityLog(
                id=uuid4(),
                event_id=str(event_id),
                actor_id="carlos",
                actor_name="Carlos",
                action_type="expense.created",
                description=f"Gasto {i}",
            )
        )
    session.commit()

    repo = NotificationRepository(session)
    assert repo.get_unread_count("ana") == 3

    marked = repo.mark_all_as_read("ana")
    assert marked == 3
    assert repo.get_unread_count("ana") == 0

    # Calling again returns 0 marked
    marked_again = repo.mark_all_as_read("ana")
    assert marked_again == 0


def test_mark_as_read_forbidden_if_not_member(session: Session):
    event_id = uuid4()
    _create_event(session, event_id, creator_id="carlos")
    session.add(EventMember(event_id=event_id, user_id="carlos", status=MemberStatus.ACTIVE))

    act = ActivityLog(
        id=uuid4(),
        event_id=str(event_id),
        actor_id="carlos",
        actor_name="Carlos",
        action_type="expense.created",
        description="Gasto privado",
    )
    session.add(act)
    session.commit()

    repo = NotificationRepository(session)
    data, success = repo.mark_as_read("intruder", act.id)
    assert success is False
    assert data is None
