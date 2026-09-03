from datetime import UTC, datetime
from uuid import uuid4

import pytest
from sqlmodel import Session, SQLModel, create_engine

import app.db.models  # noqa: F401
from app.core.errors import NotFoundError
from app.modules.activity.models.activity import ActivityLog
from app.modules.activity.services.notification_service import NotificationService
from app.modules.events.models.enums import MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember


@pytest.fixture
def session():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


def _create_event(session: Session, event_id, creator_id="carlos"):
    event = Event(
        id=event_id,
        name="Viaje a Tarija",
        icon="plane",
        starts_at=datetime.now(UTC),
        ends_at=datetime.now(UTC),
        user_id=creator_id,
    )
    session.add(event)
    return event


def test_get_user_notifications_resolves_titles_and_paths(session: Session):
    event_id = uuid4()
    _create_event(session, event_id, creator_id="carlos")
    session.add(EventMember(event_id=event_id, user_id="carlos", status=MemberStatus.ACTIVE))
    session.add(EventMember(event_id=event_id, user_id="ana", status=MemberStatus.ACTIVE))

    session.add(
        ActivityLog(
            id=uuid4(),
            event_id=str(event_id),
            actor_id="carlos",
            actor_name="Carlos Ruiz",
            action_type="expense.created",
            description="Carlos registró Cena de bienvenida",
        )
    )
    session.commit()

    service = NotificationService(session)
    response = service.get_user_notifications("ana")

    assert response.total == 1
    assert response.unread_count == 1
    assert len(response.items) == 1
    item = response.items[0]
    assert item.title == "Nuevo gasto registrado"
    assert item.target_path == f"/events/{event_id}"
    assert item.is_read is False


def test_get_unread_count(session: Session):
    event_id = uuid4()
    _create_event(session, event_id, creator_id="carlos")
    session.add(EventMember(event_id=event_id, user_id="carlos", status=MemberStatus.ACTIVE))
    session.add(EventMember(event_id=event_id, user_id="ana", status=MemberStatus.ACTIVE))

    session.add(
        ActivityLog(
            id=uuid4(),
            event_id=str(event_id),
            actor_id="carlos",
            actor_name="Carlos",
            action_type="payment.submitted",
            description="Pago registrado",
        )
    )
    session.commit()

    service = NotificationService(session)
    unread = service.get_unread_count("ana")
    assert unread.unread_count == 1

    # Carlos (author) should have 0
    assert service.get_unread_count("carlos").unread_count == 0


def test_mark_as_read_success_and_not_found(session: Session):
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

    service = NotificationService(session)
    res = service.mark_as_read("ana", act.id)
    assert res.is_read is True
    assert res.read_at is not None

    # Marking non-existent or inaccessible raises NotFoundError
    with pytest.raises(NotFoundError):
        service.mark_as_read("ana", uuid4())

    with pytest.raises(NotFoundError):
        service.mark_as_read("intruder", act.id)


def test_mark_all_as_read(session: Session):
    event_id = uuid4()
    _create_event(session, event_id, creator_id="carlos")
    session.add(EventMember(event_id=event_id, user_id="carlos", status=MemberStatus.ACTIVE))
    session.add(EventMember(event_id=event_id, user_id="ana", status=MemberStatus.ACTIVE))

    for i in range(2):
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

    service = NotificationService(session)
    batch = service.mark_all_as_read("ana")
    assert batch.marked_count == 2
    assert batch.status == "ok"
    assert service.get_unread_count("ana").unread_count == 0
