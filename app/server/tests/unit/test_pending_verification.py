from datetime import UTC, datetime
from decimal import Decimal
from unittest.mock import MagicMock

from sqlmodel import Session, SQLModel, create_engine

import app.db.models
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.user_proxy import User
from app.modules.expenses.models.enums import ExpenseCategory, ExpenseSplitType
from app.modules.expenses.models.expense import Expense
from app.modules.expenses.models.expense_split import ExpenseSplit
from app.modules.expenses.repositories.expense_repository import ExpenseRepository
from app.modules.expenses.repositories.expense_split_repository import ExpenseSplitRepository
from app.modules.payments.models.enums import PaymentMethod, PaymentStatus
from app.modules.payments.models.payment import Payment
from app.modules.payments.repositories.payment_repository import PaymentRepository
from app.modules.payments.repositories.unit_of_work import PaymentUnitOfWork
from app.modules.payments.services.payment_service import PaymentService


def test_get_pending_verification_returns_pending_payments():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    session = Session(engine)

    payer_user_id = "user_payer_111"
    debtor_user_id = "user_debtor_222"

    session.add_all([
        User(id=payer_user_id, name="Pagador Principal", email="payer@example.com"),
        User(id=debtor_user_id, name="Deudor Amigo", email="debtor@example.com"),
    ])
    session.commit()

    event = Event(
        name="Fiesta Fin de Año",
        icon="party",
        starts_at=datetime.now(UTC),
        ends_at=datetime.now(UTC),
        status=EventStatus.OPEN,
        user_id=payer_user_id,
    )
    session.add(event)
    session.commit()
    session.refresh(event)

    payer_member = EventMember(
        event_id=event.id,
        user_id=payer_user_id,
        status=MemberStatus.ACTIVE,
    )
    debtor_member = EventMember(
        event_id=event.id,
        user_id=debtor_user_id,
        status=MemberStatus.ACTIVE,
    )
    session.add_all([payer_member, debtor_member])
    session.commit()
    session.refresh(payer_member)
    session.refresh(debtor_member)

    expense = Expense(
        event_id=event.id,
        created_by_member_id=payer_member.id,
        paid_by_member_id=payer_member.id,
        name="Bebidas",
        amount=Decimal("120.00"),
        refund_amount=Decimal("60.00"),
        payer_participated=True,
        category=ExpenseCategory.FOOD,
        split_type=ExpenseSplitType.EQUAL,
        expense_date=datetime.now(UTC),
    )
    session.add(expense)
    session.commit()
    session.refresh(expense)

    split = ExpenseSplit(
        expense_id=expense.id,
        member_id=debtor_member.id,
        assigned_amount=Decimal("60.00"),
    )
    session.add(split)
    session.commit()
    session.refresh(split)

    payment = Payment(
        split_id=split.id,
        payment_method=PaymentMethod.QR,
        status=PaymentStatus.PENDING_CONFIRMATION,
        proof_image_url="https://example.com/proof.jpg",
    )
    session.add(payment)
    session.commit()

    mock_event_context = MagicMock()
    mock_event_context.member_name.return_value = "Deudor Amigo"

    service = PaymentService(
        payment_repo=PaymentRepository(session),
        split_repo=ExpenseSplitRepository(session),
        expense_repo=ExpenseRepository(session),
        uow=PaymentUnitOfWork(session),
        event_context=mock_event_context,
        activity_service=MagicMock(),
    )

    pending = service.get_pending_verification(payer_user_id)

    assert len(pending) == 1
    assert pending[0].payment_id == payment.id
    assert pending[0].split_id == split.id
    assert pending[0].expense_name == "Bebidas"
    assert pending[0].event_name == "Fiesta Fin de Año"
    assert pending[0].debtor_name == "Deudor Amigo"
    assert pending[0].amount == Decimal("60.00")
    assert pending[0].payment_method == PaymentMethod.QR
