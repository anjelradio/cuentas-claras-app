from datetime import UTC, datetime, timedelta
from decimal import Decimal
from io import BytesIO
from unittest.mock import MagicMock

import pytest
from PIL import Image
from sqlmodel import Session, SQLModel, create_engine

from app.core.errors import InfrastructureError
from app.modules.activity.services.activity import ActivityService
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.user_proxy import User
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.services.event_authorization_service import EventAuthorizationService
from app.modules.expenses.integrations.receipt_storage import ExpenseReceiptStorage, StoredReceipt
from app.modules.expenses.models.enums import ExpenseCategory, ExpenseSplitType
from app.modules.expenses.repositories.expense_repository import ExpenseRepository
from app.modules.expenses.repositories.expense_split_repository import ExpenseSplitRepository
from app.modules.expenses.repositories.unit_of_work import ExpenseUnitOfWork
from app.modules.expenses.schemas.expense_schemas import ExpenseCreateRequest
from app.modules.expenses.services.expense_service import ExpenseService


def create_test_image_bytes(format="JPEG") -> bytes:
    buf = BytesIO()
    img = Image.new("RGB", (50, 50), color="green")
    img.save(buf, format=format)
    return buf.getvalue()


@pytest.fixture
def atomicity_setup():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    session = Session(engine)

    u1 = User(id="user-1", name="Ana Lopez", email="ana@example.com")
    session.add(u1)
    session.commit()

    now = datetime.now(UTC)
    event1 = Event(
        name="Viaje",
        icon="car",
        starts_at=now,
        ends_at=now + timedelta(days=1),
        user_id="user-1",
        status=EventStatus.OPEN,
    )
    session.add(event1)
    session.commit()

    m1 = EventMember(event_id=event1.id, user_id="user-1", status=MemberStatus.ACTIVE)
    session.add(m1)
    session.commit()

    event_repo = EventRepository(session)
    member_repo = MemberRepository(session)
    auth_service = EventAuthorizationService(event_repo, member_repo)
    activity_service = ActivityService(session)
    expense_repo = ExpenseRepository(session)
    split_repo = ExpenseSplitRepository(session)
    uow = ExpenseUnitOfWork(session)

    mock_storage = MagicMock(spec=ExpenseReceiptStorage)

    service = ExpenseService(
        expense_repo=expense_repo,
        split_repo=split_repo,
        uow=uow,
        auth_service=auth_service,
        member_repo=member_repo,
        activity_service=activity_service,
        receipt_storage=mock_storage,
    )

    return {
        "session": session,
        "service": service,
        "event1": event1,
        "m1": m1,
        "mock_storage": mock_storage,
    }


def test_receipt_cloudinary_fails_before_sql_zero_db_rows(atomicity_setup):
    service = atomicity_setup["service"]
    event1 = atomicity_setup["event1"]
    m1 = atomicity_setup["m1"]

    # Simular fallo en Cloudinary al subir
    service.receipt_storage.upload_receipt = MagicMock(
        side_effect=InfrastructureError("Cloudinary service unavailable")
    )

    req = ExpenseCreateRequest(
        name="Hotel",
        amount=Decimal("200.00"),
        category=ExpenseCategory.LODGING,
        split_type=ExpenseSplitType.EQUAL,
        paid_by_member_id=m1.id,
        expense_date=datetime.now(UTC),
        participant_member_ids=[m1.id],
    )

    with pytest.raises(InfrastructureError):
        service.create_expense(
            event_id=event1.id,
            user_id="user-1",
            request=req,
            receipt_file=(b"fake-image-bytes", "image/jpeg"),
        )

    # Verificar que NO se persistió ninguna fila en BD
    expenses = service.expense_repo.list_by_event(event1.id)
    assert len(expenses) == 0


def test_receipt_sql_fails_triggers_cloudinary_destroy_compensation(atomicity_setup):
    service = atomicity_setup["service"]
    event1 = atomicity_setup["event1"]
    m1 = atomicity_setup["m1"]
    mock_storage = atomicity_setup["mock_storage"]

    # Simular subida exitosa en Cloudinary
    mock_storage.upload_receipt.return_value = StoredReceipt(
        secure_url="https://res.cloudinary.com/test/receipt.jpg",
        public_id="receipts/event-123/receipt-uuid-456",
    )

    # Simular fallo en SQL durante create_all splits
    service.split_repo.create_all = MagicMock(
        side_effect=RuntimeError("Database constraint failure")
    )

    req = ExpenseCreateRequest(
        name="Almuerzo con comprobante",
        amount=Decimal("150.00"),
        category=ExpenseCategory.FOOD,
        split_type=ExpenseSplitType.EQUAL,
        paid_by_member_id=m1.id,
        expense_date=datetime.now(UTC),
        participant_member_ids=[m1.id],
    )

    img_bytes = create_test_image_bytes()

    with pytest.raises(RuntimeError, match="Database constraint failure"):
        service.create_expense(
            event_id=event1.id,
            user_id="user-1",
            request=req,
            receipt_file=(img_bytes, "image/jpeg"),
        )

    # Comprobar que se ejecutó la acción de compensación destroy()
    mock_storage.destroy.assert_called_once_with("receipts/event-123/receipt-uuid-456")

    # Comprobar que no quedó ningún registro en base de datos
    expenses = service.expense_repo.list_by_event(event1.id)
    assert len(expenses) == 0
