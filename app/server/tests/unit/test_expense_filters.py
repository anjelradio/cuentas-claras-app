from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from sqlmodel import Session, SQLModel, create_engine

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
def filter_setup():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    session = Session(engine)

    u1 = User(id="user-1", name="Ana", email="ana@example.com")
    u2 = User(id="user-2", name="Carlos", email="carlos@example.com")
    u3 = User(id="user-3", name="Elena", email="elena@example.com")
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
    session.add(event1)
    session.commit()

    m1 = EventMember(event_id=event1.id, user_id="user-1", status=MemberStatus.ACTIVE)
    m2 = EventMember(event_id=event1.id, user_id="user-2", status=MemberStatus.ACTIVE)
    m3 = EventMember(event_id=event1.id, user_id="user-3", status=MemberStatus.ACTIVE)
    session.add_all([m1, m2, m3])
    session.commit()

    service = ExpenseService(
        expense_repo=ExpenseRepository(session),
        split_repo=ExpenseSplitRepository(session),
        uow=ExpenseUnitOfWork(session),
        event_context=ExpenseContextService(EventRepository(session), MemberRepository(session)),
        activity_service=ActivityService(session),
    )

    # Gasto 1: Pagado por m1, participan m1 y m2
    service.create_expense(
        event_id=event1.id,
        user_id="user-1",
        request=ExpenseCreateRequest(
            name="Gasto 1",
            amount=Decimal("100.00"),
            category=ExpenseCategory.FOOD,
            split_type=ExpenseSplitType.EQUAL,
            payer_participated=True,
            expense_date=now,
            participant_member_ids=[m2.id],
        ),
    )

    # Gasto 2: Pagado por m2, participan solo m2 y m3 (m1 no es pagador ni participante)
    service.create_expense(
        event_id=event1.id,
        user_id="user-2",
        request=ExpenseCreateRequest(
            name="Gasto 2",
            amount=Decimal("50.00"),
            category=ExpenseCategory.TRANSPORT,
            split_type=ExpenseSplitType.EQUAL,
            payer_participated=True,
            expense_date=now,
            participant_member_ids=[m3.id],
        ),
    )

    return {"service": service, "event": event1, "m1": m1, "m2": m2, "m3": m3}


def test_filter_all_returns_all_active_expenses(filter_setup):
    service = filter_setup["service"]
    event = filter_setup["event"]

    results = service.list_event_expenses(event.id, user_id="user-1", filter_type="all")
    assert len(results) == 2


def test_filter_mine_returns_only_user_involved(filter_setup):
    service = filter_setup["service"]
    event = filter_setup["event"]

    # user-1 is involved only in Gasto 1
    results = service.list_event_expenses(event.id, user_id="user-1", filter_type="mine")
    assert len(results) == 1
    assert results[0].name == "Gasto 1"


def test_filter_others_returns_only_user_not_involved(filter_setup):
    service = filter_setup["service"]
    event = filter_setup["event"]

    # user-1 is NOT involved in Gasto 2
    results = service.list_event_expenses(event.id, user_id="user-1", filter_type="others")
    assert len(results) == 1
    assert results[0].name == "Gasto 2"
