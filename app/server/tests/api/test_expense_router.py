from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

import httpx
import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import Settings
from app.core.security import get_current_user
from app.main import create_app
from app.modules.activity.services.activity import ActivityService
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.user_proxy import User
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.services.expense_context_service import ExpenseContextService
from app.modules.expenses.dependencies import get_expense_service
from app.modules.expenses.integrations.receipt_storage import ExpenseReceiptStorage, StoredReceipt
from app.modules.expenses.repositories.expense_repository import ExpenseRepository
from app.modules.expenses.repositories.expense_split_repository import ExpenseSplitRepository
from app.modules.expenses.repositories.unit_of_work import ExpenseUnitOfWork
from app.modules.expenses.services.expense_service import ExpenseService


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
def seeded_db(test_db):
    u1 = User(id="user-1", name="Ana Lopez", email="ana@example.com")
    u2 = User(id="user-2", name="Carlos Ruiz", email="carlos@example.com")
    test_db.add_all([u1, u2])
    test_db.commit()

    now = datetime.now(UTC)
    event1 = Event(
        name="Viaje Samaipata",
        icon="mountain",
        starts_at=now,
        ends_at=now + timedelta(days=2),
        user_id="user-1",
        status=EventStatus.OPEN,
    )
    test_db.add(event1)
    test_db.commit()

    m1 = EventMember(event_id=event1.id, user_id="user-1", status=MemberStatus.ACTIVE)
    m2 = EventMember(event_id=event1.id, user_id="user-2", status=MemberStatus.ACTIVE)
    test_db.add_all([m1, m2])
    test_db.commit()

    return {"session": test_db, "event": event1, "m1": m1, "m2": m2, "u1": u1, "u2": u2}


@pytest.fixture
def mock_storage():
    storage = MagicMock(spec=ExpenseReceiptStorage)
    storage.upload_receipt.return_value = StoredReceipt(
        secure_url="https://res.cloudinary.com/test/receipt.jpg",
        public_id="receipts/test-123",
    )
    return storage


@pytest.fixture
def test_client(seeded_db, mock_storage):
    settings = Settings(
        app_env="test",
        app_name="cuentas-claras-server",
        database_url="sqlite:///:memory:",
        cors_origins=["http://localhost:3000"],
    )
    app = create_app(settings)

    session = seeded_db["session"]

    def override_get_current_user():
        return "user-1"

    def override_get_expense_service():
        event_repo = EventRepository(session)
        member_repo = MemberRepository(session)
        activity_service = ActivityService(session)
        return ExpenseService(
            expense_repo=ExpenseRepository(session),
            split_repo=ExpenseSplitRepository(session),
            uow=ExpenseUnitOfWork(session),
            event_context=ExpenseContextService(event_repo, member_repo),
            activity_service=activity_service,
            receipt_storage=mock_storage,
        )

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_expense_service] = override_get_expense_service

    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://testserver")


@pytest.mark.anyio
async def test_create_and_get_expense_json(test_client, seeded_db):
    event = seeded_db["event"]
    m1 = seeded_db["m1"]
    m2 = seeded_db["m2"]

    payload = {
        "name": "Cena",
        "description": "Pizza grupal",
        "amount": "120.00",
        "category": "food",
        "split_type": "equal",
        "payer_participated": True,
        "expense_date": datetime.now(UTC).isoformat(),
        "participant_member_ids": [str(m2.id)],
    }

    async with test_client as client:
        res = await client.post(f"/api/events/{event.id}/expenses", json=payload)
        assert res.status_code == 201
        created = res.json()
        assert created["name"] == "Cena"
        assert created["amount"] == "120.00"
        expense_id = created["id"]

        # Detail
        res_detail = await client.get(f"/api/expenses/{expense_id}")
        assert res_detail.status_code == 200
        detail = res_detail.json()
        assert detail["created_by_member_name"] == "Ana Lopez"
        assert len(detail["splits"]) == 1
        assert detail["splits"][0]["assigned_amount"] == "60.00"

        # List
        res_list = await client.get(f"/api/events/{event.id}/expenses?filter=mine")
        assert res_list.status_code == 200
        assert len(res_list.json()) == 1


@pytest.mark.anyio
async def test_update_and_delete_expense(test_client, seeded_db):
    event = seeded_db["event"]
    m1 = seeded_db["m1"]
    m2 = seeded_db["m2"]

    payload = {
        "name": "Hotel",
        "amount": "200.00",
        "category": "lodging",
        "split_type": "equal",
        "payer_participated": True,
        "expense_date": datetime.now(UTC).isoformat(),
        "participant_member_ids": [str(m2.id)],
    }

    async with test_client as client:
        res = await client.post(f"/api/events/{event.id}/expenses", json=payload)
        assert res.status_code == 201
        expense_id = res.json()["id"]

        # Patch
        patch_res = await client.patch(
            f"/api/expenses/{expense_id}",
            json={"name": "Hotel Resort", "amount": "250.00"},
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["name"] == "Hotel Resort"
        assert patch_res.json()["amount"] == "250.00"

        # Delete
        del_res = await client.delete(f"/api/expenses/{expense_id}")
        assert del_res.status_code == 204

        # List should now be empty
        res_list = await client.get(f"/api/events/{event.id}/expenses")
        assert len(res_list.json()) == 0
