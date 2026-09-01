from datetime import UTC, datetime, timedelta

from sqlmodel import Session, SQLModel, create_engine

from app.modules.activity.services.activity import ActivityService
from app.modules.events.models.user_proxy import User
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.repositories.unit_of_work import EventUnitOfWork
from app.modules.events.schemas.event_schemas import EventCreateRequest, EventUpdateRequest
from app.modules.events.services.event_service import EventService


def test_event_service_creates_event_and_logs_activity_regression():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        # Create user
        user = User(id="user-123", name="Ana Lopez", email="ana@example.com")
        session.add(user)
        session.commit()

        events_repo = EventRepository(session)
        members_repo = MemberRepository(session)
        uow = EventUnitOfWork(session)
        activity_service = ActivityService(session)
        service = EventService(events_repo, members_repo, uow, activity_service=activity_service)

        now = datetime.now(UTC)
        request = EventCreateRequest(
            name="Viaje Samaipata",
            description="Fin de semana",
            icon="mountain",
            starts_at=now,
            ends_at=now + timedelta(days=2),
        )

        event = service.create_event(request, user_id="user-123")
        assert event.id is not None

        # Verify activity log was persisted by the EventUnitOfWork commit
        activities, count = activity_service.repository.list_activities(str(event.id))
        assert count == 1
        assert activities[0].action_type == "event_created"
        assert activities[0].actor_id == "user-123"


def test_event_service_updates_event_and_logs_activity_regression():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        user = User(id="user-123", name="Ana Lopez", email="ana@example.com")
        session.add(user)
        session.commit()

        events_repo = EventRepository(session)
        members_repo = MemberRepository(session)
        uow = EventUnitOfWork(session)
        activity_service = ActivityService(session)
        service = EventService(events_repo, members_repo, uow, activity_service=activity_service)

        now = datetime.now(UTC)
        request = EventCreateRequest(
            name="Viaje Samaipata",
            description="Fin de semana",
            icon="mountain",
            starts_at=now,
            ends_at=now + timedelta(days=2),
        )
        event = service.create_event(request, user_id="user-123")

        update_req = EventUpdateRequest(name="Viaje Samaipata 2026")
        updated = service.update_event(event.id, user_id="user-123", request=update_req)
        assert updated.name == "Viaje Samaipata 2026"

        activities, count = activity_service.repository.list_activities(str(event.id))
        assert count == 2
        assert activities[0].action_type == "event_updated"
