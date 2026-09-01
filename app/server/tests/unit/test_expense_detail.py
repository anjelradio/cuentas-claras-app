from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from sqlmodel import Session, SQLModel, create_engine

from app.core.errors import ForbiddenError
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
def detail_setup():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    session = Session(engine)

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
    session.add(event1)
    session.commit()

    m1 = EventMember(event_id=event1.id, user_id="user-1", status=MemberStatus.ACTIVE)
    m2 = EventMember(event_id=event1.id, user_id="user-2", status=MemberStatus.ACTIVE)
    session.add_all([m1, m2])
    session.commit()

    service = ExpenseService(
        expense_repo=ExpenseRepository(session),
        split_repo=ExpenseSplitRepository(session),
        uow=ExpenseUnitOfWork(session),
        event_context=ExpenseContextService(EventRepository(session), MemberRepository(session)),
        activity_service=ActivityService(session),
    )

    created = service.create_expense(
        event_id=event1.id,
        user_id="user-1",
        request=ExpenseCreateRequest(
            name="Cena en el puerto",
            description="Mariscos",
            amount=Decimal("120.00"),
            category=ExpenseCategory.FOOD,
            split_type=ExpenseSplitType.EQUAL,
            payer_participated=True,
            expense_date=now,
            participant_member_ids=[m2.id],
        ),
    )

    return {"service": service, "event": event1, "expense": created, "m1": m1, "m2": m2}


def test_get_expense_detail_success(detail_setup):
    service = detail_setup["service"]
    expense = detail_setup["expense"]

    detail = service.get_expense_detail(expense.id, user_id="user-1")
    assert detail.id == expense.id
    assert detail.name == "Cena en el puerto"
    assert detail.created_by_member_name == "Ana Lopez"
    assert detail.paid_by_member_name == "Ana Lopez"
    assert len(detail.splits) == 1
    assert detail.splits[0].assigned_amount == Decimal("60.00")


def test_get_expense_detail_non_member_forbidden(detail_setup):
    service = detail_setup["service"]
    expense = detail_setup["expense"]

    with pytest.raises(ForbiddenError):
        service.get_expense_detail(expense.id, user_id="user-3")
