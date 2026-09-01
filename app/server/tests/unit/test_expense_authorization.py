from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from sqlmodel import Session, SQLModel, create_engine

from app.core.errors import ForbiddenError, ValidationError
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
from app.modules.expenses.schemas.expense_schemas import ExpenseCreateRequest, ExpenseUpdateRequest
from app.modules.expenses.services.expense_service import ExpenseService


@pytest.fixture
def auth_setup():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    session = Session(engine)

    u_owner = User(id="user-owner", name="Owner", email="owner@example.com")
    u_creator = User(id="user-creator", name="Creator", email="creator@example.com")
    u_other = User(id="user-other", name="Other", email="other@example.com")
    session.add_all([u_owner, u_creator, u_other])
    session.commit()

    now = datetime.now(UTC)
    event1 = Event(
        name="Evento",
        icon="star",
        starts_at=now,
        ends_at=now + timedelta(days=1),
        user_id="user-owner",
        status=EventStatus.OPEN,
    )
    session.add(event1)
    session.commit()

    m_owner = EventMember(event_id=event1.id, user_id="user-owner", status=MemberStatus.ACTIVE)
    m_creator = EventMember(event_id=event1.id, user_id="user-creator", status=MemberStatus.ACTIVE)
    m_other = EventMember(event_id=event1.id, user_id="user-other", status=MemberStatus.ACTIVE)
    session.add_all([m_owner, m_creator, m_other])
    session.commit()

    service = ExpenseService(
        expense_repo=ExpenseRepository(session),
        split_repo=ExpenseSplitRepository(session),
        uow=ExpenseUnitOfWork(session),
        event_context=ExpenseContextService(EventRepository(session), MemberRepository(session)),
        activity_service=ActivityService(session),
    )

    # Gasto creado por u_creator
    expense = service.create_expense(
        event_id=event1.id,
        user_id="user-creator",
        request=ExpenseCreateRequest(
            name="Almuerzo",
            amount=Decimal("50.00"),
            category=ExpenseCategory.FOOD,
            split_type=ExpenseSplitType.EQUAL,
            payer_participated=True,
            expense_date=now,
            participant_member_ids=[m_other.id],
        ),
    )

    return {
        "session": session,
        "service": service,
        "event": event1,
        "expense": expense,
    }


def test_creator_can_update_and_delete(auth_setup):
    service = auth_setup["service"]
    expense = auth_setup["expense"]

    updated = service.update_expense(
        expense.id,
        user_id="user-creator",
        request=ExpenseUpdateRequest(name="Almuerzo Actualizado"),
    )
    assert updated.name == "Almuerzo Actualizado"

    service.delete_expense(expense.id, user_id="user-creator")
    deleted = service.expense_repo.get_by_id(expense.id)
    assert deleted is None


def test_event_owner_can_update_and_delete(auth_setup):
    service = auth_setup["service"]
    expense = auth_setup["expense"]

    updated = service.update_expense(
        expense.id,
        user_id="user-owner",
        request=ExpenseUpdateRequest(name="Almuerzo Editado por Owner"),
    )
    assert updated.name == "Almuerzo Editado por Owner"


def test_other_active_member_cannot_update_or_delete(auth_setup):
    service = auth_setup["service"]
    expense = auth_setup["expense"]

    with pytest.raises(ForbiddenError):
        service.update_expense(
            expense.id,
            user_id="user-other",
            request=ExpenseUpdateRequest(name="Intento Ilegitimo"),
        )

    with pytest.raises(ForbiddenError):
        service.delete_expense(expense.id, user_id="user-other")


def test_closed_event_blocks_edit_and_delete(auth_setup):
    service = auth_setup["service"]
    session = auth_setup["session"]
    event = auth_setup["event"]
    expense = auth_setup["expense"]

    event.status = EventStatus.CLOSED
    session.add(event)
    session.commit()

    with pytest.raises(ValidationError, match="cerrado"):
        service.update_expense(
            expense.id,
            user_id="user-creator",
            request=ExpenseUpdateRequest(name="Intento en evento cerrado"),
        )

    with pytest.raises(ValidationError, match="cerrado"):
        service.delete_expense(expense.id, user_id="user-creator")
