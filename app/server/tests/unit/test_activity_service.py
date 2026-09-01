from sqlmodel import Session, SQLModel, create_engine

from app.modules.activity.services.activity import ActivityService


def test_activity_service_log_activity_flushes_without_independent_commit():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        service = ActivityService(session)
        activity = service.log_activity(
            event_id="test-event-id",
            actor_id="test-user-id",
            actor_name="Test User",
            action_type="test_action",
            description="Test description",
            target_name="Test Target",
        )
        assert activity.id is not None
        assert activity.action_type == "test_action"

        # El cambio está flusheado en la sesión pero el commit final lo decide
        # la transacción externa
        session.rollback()
        # Después de rollback, no debe existir
        activities, count = service.repository.list_activities("test-event-id")
        assert count == 0
