from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from sqlmodel import Session, SQLModel, create_engine

from app.core.errors import ValidationError
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


@pytest.fixture
def session():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


@pytest.fixture
def test_setup(session):
    u1 = User(id="user-1", name="Ana Lopez", email="ana@example.com")
    u2 = User(id="user-2", name="Carlos Ruiz", email="carlos@example.com")
    u3 = User(id="user-3", name="Elena Gomez", email="elena@example.com")
    session.add_all([u1, u2, u3])
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
    event2 = Event(
        name="Otro Evento",
        icon="party",
        starts_at=now,
        ends_at=now + timedelta(days=1),
        user_id="user-3",
        status=EventStatus.OPEN,
    )
    session.add_all([event1, event2])
    session.commit()

    m1 = EventMember(event_id=event1.id, user_id="user-1", status=MemberStatus.ACTIVE)
    m2 = EventMember(event_id=event1.id, user_id="user-2", status=MemberStatus.ACTIVE)
    m3_other = EventMember(event_id=event2.id, user_id="user-3", status=MemberStatus.ACTIVE)
    session.add_all([m1, m2, m3_other])
    session.commit()

    event_repo = EventRepository(session)
    member_repo = MemberRepository(session)
    activity_service = ActivityService(session)
    expense_repo = ExpenseRepository(session)
    split_repo = ExpenseSplitRepository(session)
    uow = ExpenseUnitOfWork(session)

    service = ExpenseService(
        expense_repo=expense_repo,
        split_repo=split_repo,
        uow=uow,
        event_context=ExpenseContextService(event_repo, member_repo),
        activity_service=activity_service,
    )

    return {
        "session": session,
        "service": service,
        "event1": event1,
        "event2": event2,
        "m1": m1,
        "m2": m2,
        "m3_other": m3_other,
    }


def test_create_expense_equal_split_success(test_setup):
    service = test_setup["service"]
    event1 = test_setup["event1"]
    m1 = test_setup["m1"]
    m2 = test_setup["m2"]

    req = ExpenseCreateRequest(
        name="Almuerzo",
        description="Pizzas",
        amount=Decimal("100.00"),
        category=ExpenseCategory.FOOD,
        split_type=ExpenseSplitType.EQUAL,
        payer_participated=True,
        expense_date=datetime.now(UTC),
        participant_member_ids=[m2.id],
    )

    expense = service.create_expense(event_id=event1.id, user_id="user-1", request=req)
    assert expense.id is not None
    assert expense.amount == Decimal("100.00")
    assert expense.name == "Almuerzo"

    splits = service.split_repo.list_active_by_expense(expense.id)
    assert len(splits) == 1
    assert sum(s.assigned_amount for s in splits) == Decimal("50.00")
    assert expense.refund_amount == Decimal("50.00")


def test_create_expense_rejects_cross_event_member(test_setup):
    service = test_setup["service"]
    event1 = test_setup["event1"]
    m1 = test_setup["m1"]
    m3_other = test_setup["m3_other"]

    req = ExpenseCreateRequest(
        name="Almuerzo",
        amount=Decimal("100.00"),
        category=ExpenseCategory.FOOD,
        split_type=ExpenseSplitType.EQUAL,
        payer_participated=True,
        expense_date=datetime.now(UTC),
        participant_member_ids=[m3_other.id],
    )

    with pytest.raises(ValidationError, match="no pertenece a este evento"):
        service.create_expense(event_id=event1.id, user_id="user-1", request=req)


def test_create_expense_rejects_duplicate_participants(test_setup):
    service = test_setup["service"]
    event1 = test_setup["event1"]
    m2 = test_setup["m2"]

    req = ExpenseCreateRequest(
        name="Almuerzo",
        amount=Decimal("100.00"),
        category=ExpenseCategory.FOOD,
        split_type=ExpenseSplitType.EQUAL,
        payer_participated=True,
        expense_date=datetime.now(UTC),
        participant_member_ids=[m2.id, m2.id],
    )

    with pytest.raises(ValidationError, match="duplicados"):
        service.create_expense(event_id=event1.id, user_id="user-1", request=req)


def test_create_expense_rejects_closed_event(test_setup):
    service = test_setup["service"]
    event1 = test_setup["event1"]
    m1 = test_setup["m1"]
    event1.status = EventStatus.CLOSED
    test_setup["session"].add(event1)
    test_setup["session"].commit()

    req = ExpenseCreateRequest(
        name="Almuerzo",
        amount=Decimal("100.00"),
        category=ExpenseCategory.FOOD,
        split_type=ExpenseSplitType.EQUAL,
        payer_participated=True,
        expense_date=datetime.now(UTC),
        participant_member_ids=[],
    )

    with pytest.raises(ValidationError, match="cerrado"):
        service.create_expense(event_id=event1.id, user_id="user-1", request=req)
