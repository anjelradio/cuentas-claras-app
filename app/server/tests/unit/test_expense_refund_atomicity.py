from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from sqlmodel import Session, SQLModel, create_engine

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
from app.modules.expenses.schemas.expense_schemas import ExpenseCreateRequest, ExpenseUpdateRequest
from app.modules.expenses.services.expense_service import ExpenseService


@pytest.fixture
def atomic_setup():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    session = Session(engine)
    session.add_all([
        User(id="user-1", name="Ana", email="ana@example.com"),
        User(id="user-2", name="Bruno", email="bruno@example.com"),
    ])
    session.commit()
    now = datetime.now(UTC)
    event = Event(name="Viaje", icon="car", starts_at=now, ends_at=now + timedelta(days=1), user_id="user-1", status=EventStatus.OPEN)
    session.add(event)
    session.commit()
    payer = EventMember(event_id=event.id, user_id="user-1", status=MemberStatus.ACTIVE)
    other = EventMember(event_id=event.id, user_id="user-2", status=MemberStatus.ACTIVE)
    session.add_all([payer, other])
    session.commit()
    service = ExpenseService(
        expense_repo=ExpenseRepository(session),
        split_repo=ExpenseSplitRepository(session),
        uow=ExpenseUnitOfWork(session),
        event_context=ExpenseContextService(EventRepository(session), MemberRepository(session)),
    )
    expense = service.create_expense(
        event.id,
        "user-1",
        ExpenseCreateRequest(
            name="Cena", amount=Decimal("100.00"), category=ExpenseCategory.FOOD,
            split_type=ExpenseSplitType.EQUAL, payer_participated=True,
            expense_date=now, participant_member_ids=[other.id],
        ),
    )
    return session, service, expense, other


def test_update_rolls_back_expense_and_splits_together(atomic_setup):
    session, service, expense, other = atomic_setup
    original = service.split_repo.list_active_by_expense(expense.id)[0].assigned_amount
    service.split_repo.update = MagicMock(side_effect=RuntimeError("split write failed"))

    with pytest.raises(RuntimeError, match="split write failed"):
        service.update_expense(
            expense.id,
            "user-1",
            ExpenseUpdateRequest(amount=Decimal("120.00"), participant_member_ids=[other.id]),
        )

    session.expire_all()
    persisted = service.expense_repo.get_by_id(expense.id)
    assert persisted is not None
    assert persisted.amount == Decimal("100.00")
    assert service.split_repo.list_active_by_expense(expense.id)[0].assigned_amount == original
