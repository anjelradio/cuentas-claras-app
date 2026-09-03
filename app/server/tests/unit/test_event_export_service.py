"""Pruebas unitarias para EventExportService."""

import unittest
from datetime import UTC, date, datetime
from decimal import Decimal
from unittest.mock import MagicMock

from sqlmodel import Session, SQLModel, create_engine

import app.db.models  # noqa: F401
from app.core.errors import ForbiddenError, NotFoundError, ValidationError
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.user_proxy import User
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.export_repository import ExportRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.services.event_export_service import EventExportService
from app.modules.expenses.models.enums import ExpenseCategory, ExpenseSplitType
from app.modules.expenses.models.expense import Expense
from app.modules.expenses.models.expense_split import ExpenseSplit
from app.modules.payments.models.enums import PaymentMethod, PaymentStatus
from app.modules.payments.models.payment import Payment


class TestEventExportService(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite://")
        SQLModel.metadata.create_all(self.engine)
        self.session = Session(self.engine)

        self.event_repo = EventRepository(self.session)
        self.member_repo = MemberRepository(self.session)
        self.export_repo = ExportRepository(self.session)
        self.service = EventExportService(
            export_repo=self.export_repo,
            event_repo=self.event_repo,
            member_repo=self.member_repo,
        )

        # Seed data
        self.u1 = User(id="u1", name="María López", email="maria@test.com")
        self.u2 = User(id="u2", name="Carlos Ríos", email="carlos@test.com")
        self.session.add_all([self.u1, self.u2])
        self.session.flush()

        self.event = Event(
            name="Viaje a Cochabamba",
            currency="Bs.",
            icon="🚌",
            status=EventStatus.OPEN,
            starts_at=datetime(2026, 8, 15, tzinfo=UTC),
            ends_at=datetime(2026, 8, 20, tzinfo=UTC),
            user_id="u1",
        )
        self.session.add(self.event)
        self.session.flush()

        self.m1 = EventMember(event_id=self.event.id, user_id="u1", status=MemberStatus.ACTIVE)
        self.m2 = EventMember(event_id=self.event.id, user_id="u2", status=MemberStatus.ACTIVE)
        self.session.add_all([self.m1, self.m2])
        self.session.flush()

        self.exp = Expense(
            event_id=self.event.id,
            created_by_member_id=self.m1.id,
            paid_by_member_id=self.m1.id,
            name="Almuerzo de Bienvenida",
            amount=Decimal("150.00"),
            category=ExpenseCategory.FOOD,
            split_type=ExpenseSplitType.EQUAL,
            expense_date=datetime(2026, 8, 15, tzinfo=UTC),
        )
        self.session.add(self.exp)
        self.session.flush()

        self.s1 = ExpenseSplit(expense_id=self.exp.id, member_id=self.m1.id, assigned_amount=Decimal("75.00"))
        self.s2 = ExpenseSplit(expense_id=self.exp.id, member_id=self.m2.id, assigned_amount=Decimal("75.00"))
        self.session.add_all([self.s1, self.s2])
        self.session.flush()

        self.payment = Payment(
            split_id=self.s2.id,
            payment_method=PaymentMethod.CASH,
            status=PaymentStatus.CONFIRMED,
            confirmed_at=datetime(2026, 8, 16, tzinfo=UTC),
        )
        self.session.add(self.payment)
        self.session.commit()

    def tearDown(self) -> None:
        self.session.close()

    def test_generate_report_csv_success(self) -> None:
        file_bytes, content_type, filename = self.service.generate_report(
            self.event.id, "u1", "csv"
        )

        assert content_type == "text/csv; charset=utf-8"
        assert filename == "viaje-a-cochabamba-reporte.csv"
        assert isinstance(file_bytes, bytes)
        assert file_bytes[:3] == b"\xef\xbb\xbf"

        text = file_bytes.decode("utf-8-sig")
        assert "Evento,Viaje a Cochabamba" in text
        assert "Moneda,Bs." in text
        assert "Creador,María López" in text
        assert "Almuerzo de Bienvenida" in text
        assert "150.00" in text
        assert "Saldado" in text

    def test_generate_report_requires_active_member(self) -> None:
        # Non-member
        with self.assertRaises(ForbiddenError):
            self.service.generate_report(self.event.id, "stranger", "csv")

        # Inactive member
        self.m2.status = MemberStatus.LEFT
        self.session.add(self.m2)
        self.session.commit()

        with self.assertRaises(ForbiddenError):
            self.service.generate_report(self.event.id, "u2", "csv")

    def test_generate_report_event_not_found(self) -> None:
        import uuid

        random_id = uuid.uuid4()
        with self.assertRaises(NotFoundError):
            self.service.generate_report(random_id, "u1", "csv")

    def test_generate_report_invalid_format(self) -> None:
        with self.assertRaises(ValidationError):
            self.service.generate_report(self.event.id, "u1", "xml")  # type: ignore

    def test_generate_report_pdf_with_mock(self) -> None:
        mock_pdf = MagicMock()
        mock_pdf.render.return_value = b"%PDF-1.4 dummy pdf"
        service = EventExportService(
            export_repo=self.export_repo,
            event_repo=self.event_repo,
            member_repo=self.member_repo,
            pdf_formatter=mock_pdf,
        )

        file_bytes, content_type, filename = service.generate_report(
            self.event.id, "u1", "pdf"
        )
        assert content_type == "application/pdf"
        assert filename == "viaje-a-cochabamba-reporte.pdf"
        assert file_bytes == b"%PDF-1.4 dummy pdf"
        mock_pdf.render.assert_called_once()

    def test_generate_report_pdf_real(self) -> None:
        """Verifica la generación real de PDF a través del servicio usando PdfFormatter."""
        file_bytes, content_type, filename = self.service.generate_report(
            self.event.id, "u1", "pdf"
        )
        assert content_type == "application/pdf"
        assert filename == "viaje-a-cochabamba-reporte.pdf"
        assert isinstance(file_bytes, bytes)
        assert file_bytes[:4] == b"%PDF"
        assert len(file_bytes) > 2000


if __name__ == "__main__":
    unittest.main()
