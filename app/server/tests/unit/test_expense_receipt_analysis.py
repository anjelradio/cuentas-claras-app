from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import Settings
from app.modules.activity.services.activity import ActivityService
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.user_proxy import User
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.services.event_authorization_service import EventAuthorizationService
from app.modules.expenses.integrations.gemini_analyzer import GeminiReceiptAnalyzer
from app.modules.expenses.integrations.receipt_storage import StoredReceipt
from app.modules.expenses.models.enums import ExpenseCategory, ExpenseSplitType
from app.modules.expenses.repositories.expense_repository import ExpenseRepository
from app.modules.expenses.repositories.expense_split_repository import ExpenseSplitRepository
from app.modules.expenses.repositories.unit_of_work import ExpenseUnitOfWork
from app.modules.expenses.schemas.expense_schemas import (
    ExpenseCreateRequest,
    ReceiptAnalysisResponse,
)
from app.modules.expenses.services.expense_service import ExpenseService


@pytest.fixture
def session():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


@pytest.fixture
def setup_data(session):
    user = User(id="user-1", name="Ana Lopez", email="ana@example.com")
    session.add(user)
    session.commit()

    now = datetime.now(UTC)
    event = Event(
        name="Viaje Copacabana",
        icon="car",
        starts_at=now,
        ends_at=now + timedelta(days=2),
        user_id="user-1",
        status=EventStatus.OPEN,
    )
    session.add(event)
    session.commit()

    member = EventMember(event_id=event.id, user_id="user-1", status=MemberStatus.ACTIVE)
    session.add(member)
    session.commit()

    return event, member


def test_gemini_analyzer_no_key():
    settings = Settings(gemini_api_key=None)
    analyzer = GeminiReceiptAnalyzer(settings)
    result = analyzer.analyze_image_bytes(
        image_bytes=b"fake_image",
        mime_type="image/jpeg",
        image_url="https://res.cloudinary.com/test/image.jpg",
    )
    assert result.is_receipt is False
    assert result.image_url == "https://res.cloudinary.com/test/image.jpg"
    assert result.name is None


def test_gemini_analyzer_mock_receipt():
    settings = Settings(gemini_api_key="fake-key")
    analyzer = GeminiReceiptAnalyzer(settings)
    analyzer.client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = '{"is_receipt": true, "name": "Café en El Medievo", "amount": 35.10, "category": "food", "description": null, "expense_date": "8/2/2019"}'
    analyzer.client.models.generate_content.return_value = mock_response

    result = analyzer.analyze_image_bytes(
        image_bytes=b"fake_image",
        mime_type="image/jpeg",
        image_url="https://res.cloudinary.com/test/image.jpg",
    )
    assert result.is_receipt is True
    assert result.name == "Café en El Medievo"
    assert result.amount == Decimal("35.10")
    assert result.category == ExpenseCategory.FOOD
    assert result.description is None
    assert result.expense_date == "2019-02-08"


def test_gemini_analyzer_mock_product_photo():
    settings = Settings(gemini_api_key="fake-key")
    analyzer = GeminiReceiptAnalyzer(settings)
    analyzer.client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = '{"is_receipt": false, "name": "Compra de frutas y verduras", "amount": null, "category": "food"}'
    analyzer.client.models.generate_content.return_value = mock_response

    result = analyzer.analyze_image_bytes(
        image_bytes=b"fake_image",
        mime_type="image/jpeg",
        image_url="https://res.cloudinary.com/test/image.jpg",
    )
    assert result.is_receipt is False
    assert result.name == "Compra de frutas y verduras"
    assert result.category == ExpenseCategory.FOOD
    assert result.amount is None
    assert result.expense_date is None


def test_expense_service_analyze_receipt(session, setup_data):
    event, member = setup_data

    mock_storage = MagicMock()
    mock_storage.upload_receipt.return_value = StoredReceipt(
        secure_url="https://cloudinary.com/uploaded.jpg", public_id="pub-1"
    )

    mock_analyzer = MagicMock()
    mock_analyzer.analyze_image_bytes.return_value = ReceiptAnalysisResponse(
        image_url="https://cloudinary.com/uploaded.jpg",
        is_receipt=True,
        name="Hotel Copacabana",
        amount=Decimal("300.00"),
        category=ExpenseCategory.LODGING,
    )

    service = ExpenseService(
        expense_repo=ExpenseRepository(session),
        split_repo=ExpenseSplitRepository(session),
        uow=ExpenseUnitOfWork(session),
        auth_service=EventAuthorizationService(EventRepository(session), MemberRepository(session)),
        member_repo=MemberRepository(session),
        activity_service=ActivityService(session),
        receipt_storage=mock_storage,
        gemini_analyzer=mock_analyzer,
    )

    result = service.analyze_receipt(
        event_id=event.id,
        user_id="user-1",
        file_content=b"some-bytes",
        content_type="image/jpeg",
    )

    assert result.is_receipt is True
    assert result.name == "Hotel Copacabana"
    mock_storage.upload_receipt.assert_called_once()


def test_expense_service_create_with_prefilled_receipt_url(session, setup_data):
    event, member = setup_data

    service = ExpenseService(
        expense_repo=ExpenseRepository(session),
        split_repo=ExpenseSplitRepository(session),
        uow=ExpenseUnitOfWork(session),
        auth_service=EventAuthorizationService(EventRepository(session), MemberRepository(session)),
        member_repo=MemberRepository(session),
        activity_service=ActivityService(session),
    )

    req = ExpenseCreateRequest(
        name="Almuerzo",
        amount=Decimal("50.00"),
        category=ExpenseCategory.FOOD,
        split_type=ExpenseSplitType.EQUAL,
        paid_by_member_id=member.id,
        expense_date=datetime.now(UTC),
        participant_member_ids=[member.id],
        receipt_url="https://cloudinary.com/prefilled-image.jpg",
    )

    expense = service.create_expense(
        event_id=event.id,
        user_id="user-1",
        request=req,
        receipt_file=None,
    )

    assert expense.receipt_url == "https://cloudinary.com/prefilled-image.jpg"
    assert expense.amount == Decimal("50.00")


def test_expense_service_discard_temp_receipt(session, setup_data):
    event, member = setup_data
    mock_storage = MagicMock()
    mock_storage.folder = "cuentas-claras/receipts"

    service = ExpenseService(
        expense_repo=ExpenseRepository(session),
        split_repo=ExpenseSplitRepository(session),
        uow=ExpenseUnitOfWork(session),
        auth_service=EventAuthorizationService(EventRepository(session), MemberRepository(session)),
        member_repo=MemberRepository(session),
        receipt_storage=mock_storage,
    )

    valid_public_id = f"cuentas-claras/receipts/{event.id}/test-id"
    service.discard_temp_receipt(
        event_id=event.id,
        user_id="user-1",
        public_id=valid_public_id,
    )

    mock_storage.destroy.assert_called_once_with(valid_public_id)

