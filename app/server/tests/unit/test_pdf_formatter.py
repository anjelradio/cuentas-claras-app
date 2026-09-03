"""Pruebas unitarias para PdfFormatter."""

import unittest
from datetime import date
from decimal import Decimal

from app.modules.events.formatters.pdf_formatter import PdfFormatter
from app.modules.events.services.export_data import (
    EventHeaderData,
    EventReportData,
    ExpenseRowData,
    MemberBalanceData,
    SettlementRowData,
)


class TestPdfFormatter(unittest.TestCase):
    def setUp(self) -> None:
        self.formatter = PdfFormatter()

        self.header = EventHeaderData(
            name="Viaje a Tarija",
            currency="Bs.",
            status="open",
            created_at=date(2026, 8, 15),
            creator_name="María López",
        )
        self.balances = [
            MemberBalanceData("María López", Decimal("350.00"), Decimal("150.00"), Decimal("200.00"), "acreedor"),
            MemberBalanceData("Carlos Ríos", Decimal("0.00"), Decimal("100.00"), Decimal("-100.00"), "deudor"),
            MemberBalanceData("Ana Torres", Decimal("100.00"), Decimal("100.00"), Decimal("0.00"), "neutro"),
        ]
        self.expenses = [
            ExpenseRowData(date(2026, 8, 15), "Almuerzo grupal en la viña", "María López", "food", Decimal("150.00"), "equal"),
            ExpenseRowData(date(2026, 8, 16), "Transporte interprovincial", "María López", "transport", Decimal("200.00"), "equal"),
        ]
        self.settlements = [
            SettlementRowData("Carlos Ríos", "María López", Decimal("50.00"), "pending_confirmation", date(2026, 8, 18)),
            SettlementRowData("Ana Torres", "María López", Decimal("75.00"), "confirmed", date(2026, 8, 19)),
        ]

    def test_render_pdf_success(self) -> None:
        data = EventReportData(
            header=self.header,
            member_balances=self.balances,
            expenses=self.expenses,
            settlements=self.settlements,
        )
        pdf_bytes = self.formatter.render(data)

        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 2000
        assert pdf_bytes[:4] == b"%PDF"

    def test_render_pdf_empty_lists(self) -> None:
        data = EventReportData(
            header=self.header,
            member_balances=[],
            expenses=[],
            settlements=[],
        )
        pdf_bytes = self.formatter.render(data)

        assert isinstance(pdf_bytes, bytes)
        assert pdf_bytes[:4] == b"%PDF"

    def test_render_pdf_large_volume_multi_page(self) -> None:
        """Verifica que listas largas generen saltos de página sin error."""
        many_expenses = [
            ExpenseRowData(
                expense_date=date(2026, 8, (i % 28) + 1),
                description=f"Gasto recurrente de prueba número {i} con descripción suficientemente larga para verificar ajuste",
                payer_name=f"Participante {i % 5}",
                category="food" if i % 2 == 0 else "transport",
                amount=Decimal(f"{(i + 1) * 12.50:.2f}"),
                split_type="equal",
            )
            for i in range(60)
        ]
        many_balances = [
            MemberBalanceData(
                display_name=f"Participante Detallado {i}",
                total_paid=Decimal("500.00"),
                total_consumed=Decimal("400.00"),
                net_difference=Decimal("100.00"),
                status="acreedor",
            )
            for i in range(25)
        ]
        data = EventReportData(
            header=self.header,
            member_balances=many_balances,
            expenses=many_expenses,
            settlements=self.settlements,
        )
        pdf_bytes = self.formatter.render(data)

        assert isinstance(pdf_bytes, bytes)
        assert pdf_bytes[:4] == b"%PDF"
        # Con 60 gastos y 25 participantes debe ocupar múltiples páginas
        assert len(pdf_bytes) > 10000


if __name__ == "__main__":
    unittest.main()
