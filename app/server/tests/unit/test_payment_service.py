from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from sqlmodel import Session, SQLModel, create_engine

from app.core.errors import ForbiddenError, NotFoundError, ValidationError
from app.modules.activity.services.activity import ActivityService
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.user_proxy import User
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.services.expense_context_service import ExpenseContextService
from app.modules.expenses.models.enums import ExpenseCategory, ExpenseSplitType
from app.modules.expenses.repositories.expense_repository import ExpenseRepository
from app.modules.expenses.repositories.expense_split_repository import ExpenseSplitRepository
from app.modules.expenses.repositories.unit_of_work import ExpenseUnitOfWork
from app.modules.expenses.schemas.expense_schemas import ExpenseCreateRequest
from app.modules.expenses.services.expense_service import ExpenseService
from app.modules.payments.models.enums import PaymentMethod, PaymentStatus
from app.modules.payments.repositories.payment_repository import PaymentRepository
from app.modules.payments.repositories.unit_of_work import PaymentUnitOfWork
from app.modules.payments.schemas.payment_schemas import PaymentCreateRequest
from app.modules.payments.services.payment_service import PaymentService


@pytest.fixture
def payment_setup():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    session = Session(engine)

    u_payer = User(id="user-payer", name="Payer Carla", email="payer@example.com")
    u_debtor = User(id="user-debtor", name="Debtor Ana", email="debtor@example.com")
    u_other = User(id="user-other", name="Other Lucía", email="other@example.com")
    session.add_all([u_payer, u_debtor, u_other])
    session.commit()

    now = datetime.now(UTC)
    event1 = Event(
        name="Viaje Copacabana",
        icon="mountain",
        starts_at=now,
        ends_at=now + timedelta(days=2),
        user_id="user-payer",
        status=EventStatus.OPEN,
    )
    session.add(event1)
    session.commit()

    m_payer = EventMember(
        event_id=event1.id,
        user_id="user-payer",
        status=MemberStatus.ACTIVE,
        qr_image="https://res.cloudinary.com/test/payer_qr.png",
        qr_image_public_id="payer_qr_123",
    )
    m_debtor = EventMember(event_id=event1.id, user_id="user-debtor", status=MemberStatus.ACTIVE)
    m_other = EventMember(event_id=event1.id, user_id="user-other", status=MemberStatus.ACTIVE)
    session.add_all([m_payer, m_debtor, m_other])
    session.commit()

    expense_service = ExpenseService(
        expense_repo=ExpenseRepository(session),
        split_repo=ExpenseSplitRepository(session),
        uow=ExpenseUnitOfWork(session),
        event_context=ExpenseContextService(EventRepository(session), MemberRepository(session)),
        activity_service=ActivityService(session),
    )

    # Gasto pagado por m_payer (200 Bs, equitativo con m_debtor y m_other)
    expense = expense_service.create_expense(
        event_id=event1.id,
        user_id="user-payer",
        request=ExpenseCreateRequest(
            name="Cena en el Lago",
            amount=Decimal("150.00"),
            category=ExpenseCategory.FOOD,
            split_type=ExpenseSplitType.EQUAL,
            payer_participated=True,
            expense_date=now,
            participant_member_ids=[m_debtor.id, m_other.id],
        ),
    )

    from app.modules.expenses.integrations.receipt_storage import StoredReceipt

    mock_storage = MagicMock()
    mock_storage.upload_receipt.return_value = StoredReceipt(
        secure_url="https://res.cloudinary.com/test/proof_transfer.png",
        public_id="proof_123",
    )

    payment_service = PaymentService(
        payment_repo=PaymentRepository(session),
        split_repo=ExpenseSplitRepository(session),
        expense_repo=ExpenseRepository(session),
        uow=PaymentUnitOfWork(session),
        event_context=ExpenseContextService(EventRepository(session), MemberRepository(session)),
        activity_service=ActivityService(session),
        proof_storage=mock_storage,
    )

    # Obtener el split de m_debtor
    splits = expense_service.split_repo.list_active_by_expense(expense.id)
    debtor_split = next(s for s in splits if s.member_id == m_debtor.id)

    return {
        "session": session,
        "payment_service": payment_service,
        "expense": expense,
        "debtor_split": debtor_split,
        "m_payer": m_payer,
        "m_debtor": m_debtor,
        "m_other": m_other,
    }


def test_get_payer_qr(payment_setup):
    service = payment_setup["payment_service"]
    expense = payment_setup["expense"]

    qr_info = service.get_payer_qr(expense.id, user_id="user-debtor")
    assert qr_info.has_qr is True
    assert qr_info.qr_image_url == "https://res.cloudinary.com/test/payer_qr.png"
    assert "Carla" in qr_info.payer_name


def test_declare_cash_payment(payment_setup):
    service = payment_setup["payment_service"]
    expense = payment_setup["expense"]
    split = payment_setup["debtor_split"]

    payment = service.declare_payment(
        expense_id=expense.id,
        split_id=split.id,
        user_id="user-debtor",
        request_data=PaymentCreateRequest(payment_method=PaymentMethod.CASH),
    )

    assert payment.status == PaymentStatus.PENDING_CONFIRMATION
    assert payment.payment_method == PaymentMethod.CASH
    assert payment.amount == Decimal("50.00")
    assert payment.proof_image_url is None


def test_declare_qr_payment_with_proof(payment_setup):
    service = payment_setup["payment_service"]
    expense = payment_setup["expense"]
    split = payment_setup["debtor_split"]

    payment = service.declare_payment(
        expense_id=expense.id,
        split_id=split.id,
        user_id="user-debtor",
        request_data=PaymentCreateRequest(payment_method=PaymentMethod.QR),
        file_content=b"fake_image_bytes",
        content_type="image/png",
    )

    assert payment.status == PaymentStatus.PENDING_CONFIRMATION
    assert payment.payment_method == PaymentMethod.QR
    assert payment.proof_image_url == "https://res.cloudinary.com/test/proof_transfer.png"


def test_declare_qr_payment_requires_proof(payment_setup):
    service = payment_setup["payment_service"]
    expense = payment_setup["expense"]
    split = payment_setup["debtor_split"]

    with pytest.raises(ValidationError, match="comprobante"):
        service.declare_payment(
            expense_id=expense.id,
            split_id=split.id,
            user_id="user-debtor",
            request_data=PaymentCreateRequest(payment_method=PaymentMethod.QR),
            file_content=None,
        )


def test_payer_cannot_declare_payment_for_themselves(payment_setup):
    service = payment_setup["payment_service"]
    expense = payment_setup["expense"]
    split = payment_setup["debtor_split"]

    with pytest.raises(ValidationError, match="pagador del gasto"):
        service.declare_payment(
            expense_id=expense.id,
            split_id=split.id,
            user_id="user-payer",
            request_data=PaymentCreateRequest(payment_method=PaymentMethod.CASH),
        )


def test_confirm_payment_flow(payment_setup):
    service = payment_setup["payment_service"]
    expense = payment_setup["expense"]
    split = payment_setup["debtor_split"]

    payment = service.declare_payment(
        expense_id=expense.id,
        split_id=split.id,
        user_id="user-debtor",
        request_data=PaymentCreateRequest(payment_method=PaymentMethod.CASH),
    )

    # Debtor cannot confirm
    with pytest.raises(ForbiddenError):
        service.confirm_payment(payment.id, user_id="user-debtor")

    # Payer confirms
    res = service.confirm_payment(payment.id, user_id="user-payer")
    assert res.status == PaymentStatus.CONFIRMED
    assert res.confirmed_at is not None


def test_reject_payment_flow(payment_setup):
    service = payment_setup["payment_service"]
    expense = payment_setup["expense"]
    split = payment_setup["debtor_split"]

    payment = service.declare_payment(
        expense_id=expense.id,
        split_id=split.id,
        user_id="user-debtor",
        request_data=PaymentCreateRequest(payment_method=PaymentMethod.CASH),
    )

    # Payer rejects
    res = service.reject_payment(
        payment.id,
        user_id="user-payer",
        rejection_reason="No recibí el efectivo",
    )
    assert res.status == PaymentStatus.REJECTED
    assert res.rejection_reason == "No recibí el efectivo"
