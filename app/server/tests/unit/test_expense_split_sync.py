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
from app.modules.events.services.event_authorization_service import EventAuthorizationService
from app.modules.expenses.models.enums import ExpenseCategory, ExpenseSplitType
from app.modules.expenses.repositories.expense_repository import ExpenseRepository
from app.modules.expenses.repositories.expense_split_repository import ExpenseSplitRepository
from app.modules.expenses.repositories.unit_of_work import ExpenseUnitOfWork
from app.modules.expenses.schemas.expense_schemas import ExpenseCreateRequest, ExpenseUpdateRequest
from app.modules.expenses.services.expense_service import ExpenseService


@pytest.fixture
def sync_setup():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    session = Session(engine)

    u1 = User(id="user-1", name="Ana", email="ana@example.com")
    u2 = User(id="user-2", name="Carlos", email="carlos@example.com")
    u3 = User(id="user-3", name="Elena", email="elena@example.com")
    u4 = User(id="user-4", name="David", email="david@example.com")
    session.add_all([u1, u2, u3, u4])
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
    m4 = EventMember(event_id=event1.id, user_id="user-4", status=MemberStatus.ACTIVE)
    session.add_all([m1, m2, m3, m4])
    session.commit()

    service = ExpenseService(
        expense_repo=ExpenseRepository(session),
        split_repo=ExpenseSplitRepository(session),
        uow=ExpenseUnitOfWork(session),
        auth_service=EventAuthorizationService(EventRepository(session), MemberRepository(session)),
        member_repo=MemberRepository(session),
        activity_service=ActivityService(session),
    )

    # Gasto inicial: Creado con m1, m2, m3 (3 participantes por 90.00 -> 30.00 cada uno)
    expense = service.create_expense(
        event_id=event1.id,
        user_id="user-1",
        request=ExpenseCreateRequest(
            name="Almuerzo",
            amount=Decimal("90.00"),
            category=ExpenseCategory.FOOD,
            split_type=ExpenseSplitType.EQUAL,
            paid_by_member_id=m1.id,
            expense_date=now,
            participant_member_ids=[m1.id, m2.id, m3.id],
        ),
    )

    return {
        "service": service,
        "expense": expense,
        "m1": m1,
        "m2": m2,
        "m3": m3,
        "m4": m4,
    }


def test_split_sync_removes_and_restores_without_duplicates(sync_setup):
    service = sync_setup["service"]
    expense = sync_setup["expense"]
    m1 = sync_setup["m1"]
    m2 = sync_setup["m2"]
    m3 = sync_setup["m3"]
    m4 = sync_setup["m4"]

    # 1. Verificar estado inicial: 3 splits activos
    initial_splits = service.split_repo.list_active_by_expense(expense.id)
    assert len(initial_splits) == 3
    assert {s.member_id for s in initial_splits} == {m1.id, m2.id, m3.id}

    # 2. Edición 1: Remover m3 (quedan m1 y m2)
    service.update_expense(
        expense_id=expense.id,
        user_id="user-1",
        request=ExpenseUpdateRequest(
            amount=Decimal("100.00"),
            participant_member_ids=[m1.id, m2.id],
        ),
    )

    # Verificar que solo hay 2 splits activos (m1 y m2 con 50.00 cada uno)
    active_splits_ed1 = service.split_repo.list_active_by_expense(expense.id)
    assert len(active_splits_ed1) == 2
    assert {s.member_id for s in active_splits_ed1} == {m1.id, m2.id}
    assert sum(s.assigned_amount for s in active_splits_ed1) == Decimal("100.00")

    # En la base de datos completa hay 3 filas (m3 tiene deleted_at not null)
    all_splits_ed1 = service.split_repo.list_all_by_expense(expense.id, include_deleted=True)
    assert len(all_splits_ed1) == 3
    m3_split_ed1 = next(s for s in all_splits_ed1 if s.member_id == m3.id)
    assert m3_split_ed1.deleted_at is not None

    # 3. Edición 2: Reincorporar m3 y agregar un nuevo participante m4 (m1, m2, m3, m4)
    service.update_expense(
        expense_id=expense.id,
        user_id="user-1",
        request=ExpenseUpdateRequest(
            amount=Decimal("120.00"),
            participant_member_ids=[m1.id, m2.id, m3.id, m4.id],
        ),
    )

    # 4. Verificar que m3 fue reutilizado sin duplicar filas (total 4 filas en la tabla)
    all_splits_ed2 = service.split_repo.list_all_by_expense(expense.id, include_deleted=True)
    assert len(all_splits_ed2) == 4

    active_splits_ed2 = service.split_repo.list_active_by_expense(expense.id)
    assert len(active_splits_ed2) == 4
    assert {s.member_id for s in active_splits_ed2} == {m1.id, m2.id, m3.id, m4.id}
    assert sum(s.assigned_amount for s in active_splits_ed2) == Decimal("120.00")

    m3_split_ed2 = next(s for s in active_splits_ed2 if s.member_id == m3.id)
    assert m3_split_ed2.id == m3_split_ed1.id  # Mismo registro UUID reutilizado
    assert m3_split_ed2.deleted_at is None
    assert m3_split_ed2.assigned_amount == Decimal("30.00")
