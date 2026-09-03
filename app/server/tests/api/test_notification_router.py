from datetime import UTC, datetime, timedelta
from uuid import uuid4

import httpx
import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

import app.db.models  # noqa: F401
from app.core.config import Settings
from app.core.security import get_current_user
from app.db.core import get_session
from app.main import create_app
from app.modules.activity.models.activity import ActivityLog
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.user_proxy import User


@pytest.fixture
def test_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture
def app_with_db(test_db):
    settings = Settings(
        app_name="Test App",
        database_url="sqlite:///:memory:",
        better_auth_url="http://localhost:3000",
        cors_origins=["http://localhost:3000"],
    )
    app = create_app(settings)
    app.dependency_overrides[get_session] = lambda: test_db
    return app


@pytest.mark.anyio
async def test_get_notifications_empty(app_with_db):
    app_with_db.dependency_overrides[get_current_user] = lambda: "user-empty"

    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app_with_db), base_url="http://test"
    ) as client:
        response = await client.get("/api/notifications")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["unread_count"] == 0
        assert data["total"] == 0


@pytest.mark.anyio
async def test_get_notifications_and_unread_count(app_with_db, test_db):
    # Setup users and event
    test_db.add_all([
        User(id="ana", name="Ana", email="ana@example.com"),
        User(id="carlos", name="Carlos", email="carlos@example.com"),
    ])
    now = datetime.now(UTC)
    event_id = uuid4()
    event = Event(
        id=event_id,
        name="Viaje Samaipata",
        icon="mountain",
        starts_at=now,
        ends_at=now + timedelta(days=2),
        user_id="carlos",
        status=EventStatus.OPEN,
    )
    test_db.add(event)
    test_db.add(EventMember(event_id=event_id, user_id="carlos", status=MemberStatus.ACTIVE))
    test_db.add(EventMember(event_id=event_id, user_id="ana", status=MemberStatus.ACTIVE))

    act = ActivityLog(
        id=uuid4(),
        event_id=str(event_id),
        actor_id="carlos",
        actor_name="Carlos Ruiz",
        action_type="expense.created",
        description="Carlos creó gasto Almuerzo",
    )
    test_db.add(act)
    test_db.commit()

    # Authenticate as Ana
    app_with_db.dependency_overrides[get_current_user] = lambda: "ana"

    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app_with_db), base_url="http://test"
    ) as client:
        # Check unread count
        count_res = await client.get("/api/notifications/unread-count")
        assert count_res.status_code == 200
        assert count_res.json()["unread_count"] == 1

        # List notifications
        list_res = await client.get("/api/notifications")
        assert list_res.status_code == 200
        data = list_res.json()
        assert data["unread_count"] == 1
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["title"] == "Nuevo gasto registrado"
        assert data["items"][0]["is_read"] is False


@pytest.mark.anyio
async def test_patch_mark_notification_read(app_with_db, test_db):
    test_db.add_all([
        User(id="ana", name="Ana", email="ana@example.com"),
        User(id="carlos", name="Carlos", email="carlos@example.com"),
    ])
    now = datetime.now(UTC)
    event_id = uuid4()
    event = Event(
        id=event_id,
        name="Viaje",
        icon="mountain",
        starts_at=now,
        ends_at=now + timedelta(days=2),
        user_id="carlos",
        status=EventStatus.OPEN,
    )
    test_db.add(event)
    test_db.add(EventMember(event_id=event_id, user_id="carlos", status=MemberStatus.ACTIVE))
    test_db.add(EventMember(event_id=event_id, user_id="ana", status=MemberStatus.ACTIVE))

    act_id = uuid4()
    test_db.add(
        ActivityLog(
            id=act_id,
            event_id=str(event_id),
            actor_id="carlos",
            actor_name="Carlos",
            action_type="payment.submitted",
            description="Pago enviado",
        )
    )
    test_db.commit()

    app_with_db.dependency_overrides[get_current_user] = lambda: "ana"

    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app_with_db), base_url="http://test"
    ) as client:
        patch_res = await client.patch(f"/api/notifications/{act_id}/read")
        assert patch_res.status_code == 200
        assert patch_res.json()["is_read"] is True

        # Check unread count is now 0
        count_res = await client.get("/api/notifications/unread-count")
        assert count_res.json()["unread_count"] == 0


@pytest.mark.anyio
async def test_post_mark_all_read(app_with_db, test_db):
    test_db.add_all([
        User(id="ana", name="Ana", email="ana@example.com"),
        User(id="carlos", name="Carlos", email="carlos@example.com"),
    ])
    now = datetime.now(UTC)
    event_id = uuid4()
    event = Event(
        id=event_id,
        name="Viaje",
        icon="mountain",
        starts_at=now,
        ends_at=now + timedelta(days=2),
        user_id="carlos",
        status=EventStatus.OPEN,
    )
    test_db.add(event)
    test_db.add(EventMember(event_id=event_id, user_id="carlos", status=MemberStatus.ACTIVE))
    test_db.add(EventMember(event_id=event_id, user_id="ana", status=MemberStatus.ACTIVE))

    for i in range(3):
        test_db.add(
            ActivityLog(
                id=uuid4(),
                event_id=str(event_id),
                actor_id="carlos",
                actor_name="Carlos",
                action_type="expense.created",
                description=f"Gasto {i}",
            )
        )
    test_db.commit()

    app_with_db.dependency_overrides[get_current_user] = lambda: "ana"

    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app_with_db), base_url="http://test"
    ) as client:
        mark_res = await client.post("/api/notifications/mark-all-read")
        assert mark_res.status_code == 200
        assert mark_res.json()["marked_count"] == 3
        assert mark_res.json()["status"] == "ok"

        count_res = await client.get("/api/notifications/unread-count")
        assert count_res.json()["unread_count"] == 0


@pytest.mark.anyio
async def test_mark_notification_not_found(app_with_db):
    app_with_db.dependency_overrides[get_current_user] = lambda: "ana"

    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app_with_db), base_url="http://test"
    ) as client:
        patch_res = await client.patch(f"/api/notifications/{uuid4()}/read")
        assert patch_res.status_code == 404
