"""Pruebas de API para el endpoint de exportación de eventos."""

from datetime import UTC, datetime, timedelta
from decimal import Decimal
import uuid

import httpx
import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import Settings
from app.core.security import get_current_user
from app.main import create_app
from app.modules.events.dependencies import get_export_service
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.user_proxy import User
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.export_repository import ExportRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.services.event_export_service import EventExportService
from app.modules.expenses.models.enums import ExpenseCategory, ExpenseSplitType
from app.modules.expenses.models.expense import Expense
from app.modules.expenses.models.expense_split import ExpenseSplit
from app.modules.payments.models.enums import PaymentMethod, PaymentStatus
from app.modules.payments.models.payment import Payment


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
        currency="Bs.",
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

    exp = Expense(
        event_id=event1.id,
        created_by_member_id=m1.id,
        paid_by_member_id=m1.id,
        name="Cena Samaipata",
        amount=Decimal("100.00"),
        category=ExpenseCategory.FOOD,
        split_type=ExpenseSplitType.EQUAL,
        expense_date=now,
    )
    test_db.add(exp)
    test_db.commit()

    s1 = ExpenseSplit(expense_id=exp.id, member_id=m1.id, assigned_amount=Decimal("50.00"))
    s2 = ExpenseSplit(expense_id=exp.id, member_id=m2.id, assigned_amount=Decimal("50.00"))
    test_db.add_all([s1, s2])
    test_db.commit()

    pay = Payment(
        split_id=s2.id,
        payment_method=PaymentMethod.CASH,
        status=PaymentStatus.CONFIRMED,
        confirmed_at=now,
    )
    test_db.add(pay)
    test_db.commit()

    return {"session": test_db, "event": event1, "m1": m1, "m2": m2, "u1": u1, "u2": u2}


@pytest.fixture
def make_client(seeded_db):
    def _create(current_user: str = "user-1"):
        settings = Settings(
            app_env="test",
            app_name="cuentas-claras-server",
            database_url="sqlite:///:memory:",
            cors_origins=["http://localhost:3000"],
        )
        app = create_app(settings)
        session = seeded_db["session"]

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_export_service] = lambda: EventExportService(
            export_repo=ExportRepository(session),
            event_repo=EventRepository(session),
            member_repo=MemberRepository(session),
        )

        transport = httpx.ASGITransport(app=app)
        return httpx.AsyncClient(transport=transport, base_url="http://testserver")

    return _create


@pytest.mark.anyio
async def test_export_event_csv_success(make_client, seeded_db):
    client = make_client("user-1")
    event = seeded_db["event"]

    response = await client.get(f"/api/events/{event.id}/export?format=csv")

    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "attachment" in response.headers["content-disposition"]
    assert "viaje-samaipata-reporte.csv" in response.headers["content-disposition"]

    # Verify BOM UTF-8
    assert response.content[:3] == b"\xef\xbb\xbf"

    # Decode content
    text = response.content.decode("utf-8-sig")
    assert "Evento,Viaje Samaipata" in text
    assert "Moneda,Bs." in text
    assert "Creador,Ana Lopez" in text
    assert "Cena Samaipata" in text
    assert "100.00" in text
    assert "Saldado" in text


@pytest.mark.anyio
async def test_export_event_forbidden_non_member(make_client, seeded_db):
    client = make_client("user-stranger")
    event = seeded_db["event"]

    response = await client.get(f"/api/events/{event.id}/export?format=csv")

    assert response.status_code == 403
    data = response.json()
    assert data["code"] == "FORBIDDEN"


@pytest.mark.anyio
async def test_export_event_not_found(make_client):
    client = make_client("user-1")
    random_id = uuid.uuid4()

    response = await client.get(f"/api/events/{random_id}/export?format=csv")

    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "NOT_FOUND"


@pytest.mark.anyio
async def test_export_event_invalid_format(make_client, seeded_db):
    client = make_client("user-1")
    event = seeded_db["event"]

    response = await client.get(f"/api/events/{event.id}/export?format=xlsx")

    assert response.status_code == 422


@pytest.mark.anyio
async def test_export_event_pdf_success(make_client, seeded_db):
    client = make_client("user-1")
    event = seeded_db["event"]

    response = await client.get(f"/api/events/{event.id}/export?format=pdf")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment" in response.headers["content-disposition"]
    assert "viaje-samaipata-reporte.pdf" in response.headers["content-disposition"]
    assert response.content[:4] == b"%PDF"
    assert len(response.content) > 2000
