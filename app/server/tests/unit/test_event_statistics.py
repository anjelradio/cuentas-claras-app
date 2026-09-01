from datetime import UTC, datetime
from decimal import Decimal
from unittest.mock import MagicMock

from sqlmodel import Session, SQLModel, create_engine

import app.db.models
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.user_proxy import User
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.repositories.unit_of_work import EventUnitOfWork
from app.modules.events.services.event_service import EventService
from app.modules.expenses.models.enums import ExpenseCategory, ExpenseSplitType
from app.modules.expenses.models.expense import Expense


def test_get_event_statistics_calculates_categories_distribution():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    session = Session(engine)

    user_id = "user_stat_123"

    session.add(User(id=user_id, name="Usuario Estadísticas", email="stat@example.com"))
    session.commit()

    event = Event(
        name="Viaje Samaipata",
        icon="mountain",
        starts_at=datetime.now(UTC),
        ends_at=datetime.now(UTC),
        status=EventStatus.OPEN,
        user_id=user_id,
    )
    session.add(event)
    session.commit()
    session.refresh(event)

    member = EventMember(
        event_id=event.id,
        user_id=user_id,
        status=MemberStatus.ACTIVE,
    )
    session.add(member)
    session.commit()
    session.refresh(member)

    # Gastos en distintas categorías
    # Comida: 300.00 Bs (75%)
    # Transporte: 100.00 Bs (25%)
    # Total: 400.00 Bs
    exp1 = Expense(
        event_id=event.id,
        created_by_member_id=member.id,
        paid_by_member_id=member.id,
        name="Almuerzo",
        amount=Decimal("200.00"),
        refund_amount=Decimal("100.00"),
        payer_participated=True,
        category=ExpenseCategory.FOOD,
        split_type=ExpenseSplitType.EQUAL,
        expense_date=datetime.now(UTC),
    )
    exp2 = Expense(
        event_id=event.id,
        created_by_member_id=member.id,
        paid_by_member_id=member.id,
        name="Cena",
        amount=Decimal("100.00"),
        refund_amount=Decimal("50.00"),
        payer_participated=True,
        category=ExpenseCategory.FOOD,
        split_type=ExpenseSplitType.EQUAL,
        expense_date=datetime.now(UTC),
    )
    exp3 = Expense(
        event_id=event.id,
        created_by_member_id=member.id,
        paid_by_member_id=member.id,
        name="Gasolina",
        amount=Decimal("100.00"),
        refund_amount=Decimal("50.00"),
        payer_participated=True,
        category=ExpenseCategory.TRANSPORT,
        split_type=ExpenseSplitType.EQUAL,
        expense_date=datetime.now(UTC),
    )
    session.add_all([exp1, exp2, exp3])
    session.commit()

    service = EventService(
        events=EventRepository(session),
        members=MemberRepository(session),
        uow=EventUnitOfWork(session),
    )

    stats = service.get_event_statistics(event.id, user_id)

    assert stats.total_amount == Decimal("400.00")
    assert stats.currency == "Bs."
    assert len(stats.categories) >= 2

    food_stat = next(c for c in stats.categories if c.category == ExpenseCategory.FOOD)
    assert food_stat.amount == Decimal("300.00")
    assert food_stat.percentage == 75.0
    assert food_stat.count == 2

    transport_stat = next(c for c in stats.categories if c.category == ExpenseCategory.TRANSPORT)
    assert transport_stat.amount == Decimal("100.00")
    assert transport_stat.percentage == 25.0
    assert transport_stat.count == 1
