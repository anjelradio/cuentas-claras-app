"""Pruebas unitarias para ExportRepository."""

import unittest
from datetime import UTC, date, datetime
from decimal import Decimal

from sqlmodel import Session, SQLModel, create_engine

import app.db.models  # noqa: F401
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.user_proxy import User
from app.modules.events.repositories.export_repository import ExportRepository
from app.modules.expenses.models.enums import ExpenseCategory, ExpenseSplitType
from app.modules.expenses.models.expense import Expense
from app.modules.expenses.models.expense_split import ExpenseSplit
from app.modules.payments.models.enums import PaymentMethod, PaymentStatus
from app.modules.payments.models.payment import Payment


class TestExportRepository(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite://")
        SQLModel.metadata.create_all(self.engine)
        self.session = Session(self.engine)

    def tearDown(self) -> None:
        self.session.close()

    def test_is_active_member(self) -> None:
        session = self.session
        user_alice = User(id="user_alice", name="Alice", email="alice@test.com")
        user_bob = User(id="user_bob", name="Bob", email="bob@test.com")
        user_charlie = User(id="user_charlie", name="Charlie", email="charlie@test.com")
        session.add_all([user_alice, user_bob, user_charlie])
        session.flush()

        event = Event(
            name="Viaje",
            icon="🚗",
            starts_at=datetime(2026, 8, 1, tzinfo=UTC),
            ends_at=datetime(2026, 8, 5, tzinfo=UTC),
            user_id="user_alice",
        )
        session.add(event)
        session.flush()

        member_alice = EventMember(event_id=event.id, user_id="user_alice", status=MemberStatus.ACTIVE)
        member_bob = EventMember(event_id=event.id, user_id="user_bob", status=MemberStatus.LEFT)
        member_deleted = EventMember(
            event_id=event.id,
            user_id="user_charlie",
            status=MemberStatus.ACTIVE,
            deleted_at=datetime.now(UTC),
        )
        session.add_all([member_alice, member_bob, member_deleted])
        session.commit()

        repo = ExportRepository(session)
        assert repo.is_active_member(event.id, "user_alice") is True
        assert repo.is_active_member(event.id, "user_bob") is False
        assert repo.is_active_member(event.id, "user_charlie") is False
        assert repo.is_active_member(event.id, "non_existent") is False

    def test_get_event_header(self) -> None:
        session = self.session
        creator = User(id="creator_id", name="María López", email="maria@test.com")
        session.add(creator)
        session.flush()

        event = Event(
            name="Viaje a Cochabamba",
            currency="Bs.",
            icon="🎉",
            status=EventStatus.OPEN,
            starts_at=datetime(2026, 8, 15, tzinfo=UTC),
            ends_at=datetime(2026, 8, 20, tzinfo=UTC),
            user_id="creator_id",
        )
        session.add(event)
        session.commit()

        repo = ExportRepository(session)
        header = repo.get_event_header(event.id)

        assert header is not None
        assert header.name == "Viaje a Cochabamba"
        assert header.currency == "Bs."
        assert header.status == "open"
        assert isinstance(header.created_at, date)
        assert header.creator_name == "María López"

        # Soft-deleted event must return None
        event.deleted_at = datetime.now(UTC)
        session.add(event)
        session.commit()
        assert repo.get_event_header(event.id) is None

    def test_get_member_balances_no_cartesian_product(self) -> None:
        session = self.session
        u1 = User(id="u1", name="Alice", email="alice@test.com")
        u2 = User(id="u2", name="Bob", email="bob@test.com")
        session.add_all([u1, u2])
        session.flush()

        event = Event(
            name="Cena",
            currency="Bs.",
            icon="🍽️",
            starts_at=datetime(2026, 9, 1, tzinfo=UTC),
            ends_at=datetime(2026, 9, 1, tzinfo=UTC),
            user_id="u1",
        )
        session.add(event)
        session.flush()

        m1 = EventMember(event_id=event.id, user_id="u1", status=MemberStatus.ACTIVE)
        m2 = EventMember(event_id=event.id, user_id="u2", status=MemberStatus.ACTIVE)
        session.add_all([m1, m2])
        session.flush()

        # Alice pays 2 expenses: 60 and 40 (total paid = 100)
        exp1 = Expense(
            event_id=event.id,
            created_by_member_id=m1.id,
            paid_by_member_id=m1.id,
            name="Comida",
            amount=Decimal("60.00"),
            category=ExpenseCategory.FOOD,
            split_type=ExpenseSplitType.EQUAL,
            expense_date=datetime(2026, 9, 1, tzinfo=UTC),
        )
        exp2 = Expense(
            event_id=event.id,
            created_by_member_id=m1.id,
            paid_by_member_id=m1.id,
            name="Bebidas",
            amount=Decimal("40.00"),
            category=ExpenseCategory.FOOD,
            split_type=ExpenseSplitType.EQUAL,
            expense_date=datetime(2026, 9, 1, tzinfo=UTC),
        )
        session.add_all([exp1, exp2])
        session.flush()

        # Splits:
        # exp1: Alice consumes 30, Bob consumes 30
        # exp2: Alice consumes 20, Bob consumes 20
        # Alice total consumed = 50, net = +50 (acreedor)
        # Bob total paid = 0, total consumed = 50, net = -50 (deudor)
        s1 = ExpenseSplit(expense_id=exp1.id, member_id=m1.id, assigned_amount=Decimal("30.00"))
        s2 = ExpenseSplit(expense_id=exp1.id, member_id=m2.id, assigned_amount=Decimal("30.00"))
        s3 = ExpenseSplit(expense_id=exp2.id, member_id=m1.id, assigned_amount=Decimal("20.00"))
        s4 = ExpenseSplit(expense_id=exp2.id, member_id=m2.id, assigned_amount=Decimal("20.00"))
        session.add_all([s1, s2, s3, s4])
        session.commit()

        repo = ExportRepository(session)
        balances = repo.get_member_balances(event.id)

        assert len(balances) == 2
        alice_bal = next(b for b in balances if b.display_name == "Alice")
        bob_bal = next(b for b in balances if b.display_name == "Bob")

        assert alice_bal.total_paid == Decimal("100.00")
        assert alice_bal.total_consumed == Decimal("50.00")
        assert alice_bal.net_difference == Decimal("50.00")
        assert alice_bal.status == "acreedor"

        assert bob_bal.total_paid == Decimal("0.00")
        assert bob_bal.total_consumed == Decimal("50.00")
        assert bob_bal.net_difference == Decimal("-50.00")
        assert bob_bal.status == "deudor"

    def test_get_expense_rows(self) -> None:
        session = self.session
        u1 = User(id="u1", name="Alice", email="alice@test.com")
        session.add(u1)
        session.flush()

        event = Event(
            name="Viaje",
            currency="Bs.",
            icon="🎉",
            starts_at=datetime(2026, 9, 1, tzinfo=UTC),
            ends_at=datetime(2026, 9, 2, tzinfo=UTC),
            user_id="u1",
        )
        session.add(event)
        session.flush()

        m1 = EventMember(event_id=event.id, user_id="u1", status=MemberStatus.ACTIVE)
        session.add(m1)
        session.flush()

        active_exp = Expense(
            event_id=event.id,
            created_by_member_id=m1.id,
            paid_by_member_id=m1.id,
            name="Almuerzo",
            amount=Decimal("150.00"),
            category=ExpenseCategory.FOOD,
            split_type=ExpenseSplitType.EQUAL,
            expense_date=datetime(2026, 9, 1, tzinfo=UTC),
        )
        deleted_exp = Expense(
            event_id=event.id,
            created_by_member_id=m1.id,
            paid_by_member_id=m1.id,
            name="Cancelado",
            amount=Decimal("50.00"),
            category=ExpenseCategory.TRANSPORT,
            split_type=ExpenseSplitType.EQUAL,
            expense_date=datetime(2026, 9, 2, tzinfo=UTC),
            deleted_at=datetime.now(UTC),
        )
        session.add_all([active_exp, deleted_exp])
        session.commit()

        repo = ExportRepository(session)
        expenses = repo.get_expense_rows(event.id)

        assert len(expenses) == 1
        assert expenses[0].description == "Almuerzo"
        assert expenses[0].payer_name == "Alice"
        assert expenses[0].amount == Decimal("150.00")
        assert expenses[0].expense_date == date(2026, 9, 1)

    def test_get_settlement_rows(self) -> None:
        session = self.session
        u1 = User(id="u1", name="Alice", email="alice@test.com")
        u2 = User(id="u2", name="Bob", email="bob@test.com")
        session.add_all([u1, u2])
        session.flush()

        event = Event(
            name="Viaje",
            currency="Bs.",
            icon="🎉",
            starts_at=datetime(2026, 9, 1, tzinfo=UTC),
            ends_at=datetime(2026, 9, 2, tzinfo=UTC),
            user_id="u1",
        )
        session.add(event)
        session.flush()

        m1 = EventMember(event_id=event.id, user_id="u1", status=MemberStatus.ACTIVE)
        m2 = EventMember(event_id=event.id, user_id="u2", status=MemberStatus.ACTIVE)
        session.add_all([m1, m2])
        session.flush()

        exp = Expense(
            event_id=event.id,
            created_by_member_id=m1.id,
            paid_by_member_id=m1.id,
            name="Comida",
            amount=Decimal("100.00"),
            category=ExpenseCategory.FOOD,
            split_type=ExpenseSplitType.EQUAL,
            expense_date=datetime(2026, 9, 1, tzinfo=UTC),
        )
        session.add(exp)
        session.flush()

        split = ExpenseSplit(expense_id=exp.id, member_id=m2.id, assigned_amount=Decimal("50.00"))
        session.add(split)
        session.flush()

        payment = Payment(
            split_id=split.id,
            payment_method=PaymentMethod.CASH,
            status=PaymentStatus.CONFIRMED,
            confirmed_at=datetime.now(UTC),
        )
        session.add(payment)
        session.commit()

        repo = ExportRepository(session)
        settlements = repo.get_settlement_rows(event.id)

        assert len(settlements) == 1
        assert settlements[0].payer_name == "Bob"
        assert settlements[0].creditor_name == "Alice"
        assert settlements[0].amount == Decimal("50.00")
        assert settlements[0].status == "confirmed"
        assert isinstance(settlements[0].created_at, date)

    def test_get_report_data_consolidated(self) -> None:
        session = self.session
        u1 = User(id="u1", name="Alice", email="alice@test.com")
        session.add(u1)
        session.flush()

        event = Event(
            name="Viaje Final",
            currency="Bs.",
            icon="🎉",
            starts_at=datetime(2026, 9, 1, tzinfo=UTC),
            ends_at=datetime(2026, 9, 2, tzinfo=UTC),
            user_id="u1",
        )
        session.add(event)
        session.flush()

        m1 = EventMember(event_id=event.id, user_id="u1", status=MemberStatus.ACTIVE)
        session.add(m1)
        session.commit()

        repo = ExportRepository(session)
        report_data = repo.get_report_data(event.id)

        assert report_data is not None
        assert report_data.header.name == "Viaje Final"
        assert len(report_data.member_balances) == 1
        assert len(report_data.expenses) == 0
        assert len(report_data.settlements) == 0

    def test_end_to_end_with_csv_formatter(self) -> None:
        from app.modules.events.formatters.csv_formatter import CsvFormatter

        session = self.session
        creator = User(id="u_creator", name="Ana Morales", email="ana@test.com")
        member2 = User(id="u_member2", name="Carlos Ruiz", email="carlos@test.com")
        session.add_all([creator, member2])
        session.flush()

        event = Event(
            name="Asado Familiar",
            currency="Bs.",
            icon="🥩",
            starts_at=datetime(2026, 9, 10, tzinfo=UTC),
            ends_at=datetime(2026, 9, 10, tzinfo=UTC),
            user_id="u_creator",
        )
        session.add(event)
        session.flush()

        m1 = EventMember(event_id=event.id, user_id="u_creator", status=MemberStatus.ACTIVE)
        m2 = EventMember(event_id=event.id, user_id="u_member2", status=MemberStatus.ACTIVE)
        session.add_all([m1, m2])
        session.flush()

        exp = Expense(
            event_id=event.id,
            created_by_member_id=m1.id,
            paid_by_member_id=m1.id,
            name="Carne y Carbón",
            amount=Decimal("120.00"),
            category=ExpenseCategory.FOOD,
            split_type=ExpenseSplitType.EQUAL,
            expense_date=datetime(2026, 9, 10, tzinfo=UTC),
        )
        session.add(exp)
        session.flush()

        s1 = ExpenseSplit(expense_id=exp.id, member_id=m1.id, assigned_amount=Decimal("60.00"))
        s2 = ExpenseSplit(expense_id=exp.id, member_id=m2.id, assigned_amount=Decimal("60.00"))
        session.add_all([s1, s2])
        session.flush()

        payment = Payment(
            split_id=s2.id,
            payment_method=PaymentMethod.QR,
            status=PaymentStatus.CONFIRMED,
            confirmed_at=datetime(2026, 9, 11, tzinfo=UTC),
        )
        session.add(payment)
        session.commit()

        repo = ExportRepository(session)
        report_data = repo.get_report_data(event.id)
        assert report_data is not None

        csv_bytes = CsvFormatter().render(report_data)
        assert isinstance(csv_bytes, bytes)
        assert csv_bytes[:3] == b"\xef\xbb\xbf"

        text = csv_bytes.decode("utf-8-sig")
        assert "Evento,Asado Familiar" in text
        assert "Moneda,Bs." in text
        assert "Creador,Ana Morales" in text
        assert "Carne y Carbón" in text
        assert "120.00" in text
        assert "Saldado" in text


if __name__ == "__main__":
    unittest.main()
