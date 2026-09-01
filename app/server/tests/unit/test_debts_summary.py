from datetime import UTC, datetime
from decimal import Decimal
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from sqlmodel import Session, SQLModel, create_engine

import app.db.models  # register metadata
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.user_proxy import User
from app.modules.expenses.models.enums import ExpenseCategory, ExpenseSplitType
from app.modules.expenses.models.expense import Expense
from app.modules.expenses.models.expense_split import ExpenseSplit
from app.modules.expenses.repositories.expense_repository import ExpenseRepository
from app.modules.expenses.repositories.expense_split_repository import ExpenseSplitRepository
from app.modules.expenses.repositories.unit_of_work import ExpenseUnitOfWork
from app.modules.expenses.services.expense_service import ExpenseService
from app.modules.payments.models.enums import PaymentMethod, PaymentStatus
from app.modules.payments.models.payment import Payment


def test_get_debts_summary_calculates_owe_and_owed():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    session = Session(engine)

    user_id = "user_me_123"
    other_user_id = "user_other_456"

    session.add_all([
        User(id=user_id, name="Yo Mismo", email="me@example.com"),
        User(id=other_user_id, name="Otro Usuario", email="other@example.com"),
    ])
    session.commit()

    # Crear evento activo
    event = Event(
        name="Viaje Copacabana",
        description="Paseo de fin de semana",
        icon="mountain",
        starts_at=datetime.now(UTC),
        ends_at=datetime.now(UTC),
        status=EventStatus.OPEN,
        user_id=user_id,
    )
    session.add(event)
    session.commit()
    session.refresh(event)

    # Miembros del evento
    member_me = EventMember(
        event_id=event.id,
        user_id=user_id,
        status=MemberStatus.ACTIVE,
    )
    member_other = EventMember(
        event_id=event.id,
        user_id=other_user_id,
        status=MemberStatus.ACTIVE,
    )
    session.add_all([member_me, member_other])
    session.commit()
    session.refresh(member_me)
    session.refresh(member_other)

    # Gasto 1: Pagado por member_other donde member_me adeuda 50.00 Bs
    expense_1 = Expense(
        event_id=event.id,
        created_by_member_id=member_other.id,
        paid_by_member_id=member_other.id,
        name="Almuerzo Trucha",
        amount=Decimal("100.00"),
        refund_amount=Decimal("50.00"),
        payer_participated=True,
        category=ExpenseCategory.FOOD,
        split_type=ExpenseSplitType.EQUAL,
        expense_date=datetime.now(UTC),
    )
    session.add(expense_1)
    session.commit()
    session.refresh(expense_1)

    split_1 = ExpenseSplit(
        expense_id=expense_1.id,
        member_id=member_me.id,
        assigned_amount=Decimal("50.00"),
    )
    session.add(split_1)

    # Gasto 2: Pagado por member_me donde member_other adeuda 75.00 Bs
    expense_2 = Expense(
        event_id=event.id,
        created_by_member_id=member_me.id,
        paid_by_member_id=member_me.id,
        name="Hotel Lago",
        amount=Decimal("150.00"),
        refund_amount=Decimal("75.00"),
        payer_participated=True,
        category=ExpenseCategory.LODGING,
        split_type=ExpenseSplitType.EQUAL,
        expense_date=datetime.now(UTC),
    )
    session.add(expense_2)
    session.commit()
    session.refresh(expense_2)

    split_2 = ExpenseSplit(
        expense_id=expense_2.id,
        member_id=member_other.id,
        assigned_amount=Decimal("75.00"),
    )
    session.add(split_2)
    session.commit()

    from app.modules.events.schemas.expense_context_schemas import UserEventMembershipContext

    # Context service mock
    mock_event_context = MagicMock()
    mock_event_context.member_name.return_value = "Otro Usuario"
    mock_event_context.list_user_active_event_memberships.return_value = [
        UserEventMembershipContext(
            event_id=event.id,
            event_name="Viaje Copacabana",
            member_id=member_me.id,
        )
    ]

    service = ExpenseService(
        expense_repo=ExpenseRepository(session),
        split_repo=ExpenseSplitRepository(session),
        uow=ExpenseUnitOfWork(session),
        event_context=mock_event_context,
    )

    summary = service.get_debts_summary(user_id)

    assert summary.total_i_owe == Decimal("50.00")
    assert summary.total_i_am_owed == Decimal("75.00")
    assert len(summary.debts_to_pay) == 1
    assert summary.debts_to_pay[0].expense_name == "Almuerzo Trucha"
    assert summary.debts_to_pay[0].amount == Decimal("50.00")
    assert summary.debts_to_pay[0].payment_status == "no_payment"

    assert len(summary.debts_to_collect) == 1
    assert summary.debts_to_collect[0].expense_name == "Hotel Lago"
    assert summary.debts_to_collect[0].total_pending_amount == Decimal("75.00")
    assert summary.debts_to_collect[0].unpaid_count == 1
