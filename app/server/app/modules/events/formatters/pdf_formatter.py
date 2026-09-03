"""Formateador PDF para reportes de eventos.

Transforma un ``EventReportData`` en un documento PDF estructurado
utilizando ReportLab (contrato export-api.md).

Estructura del documento:
  1. Título y metadatos del evento (nombre, moneda, estado, creador, fecha)
  2. Tabla: Balance individual de participantes
  3. Tabla: Historial detallado de gastos activos
  4. Tabla: Estado de liquidaciones entre participantes
  5. Pie de página con numeración y marca de tiempo de generación
"""

import io
from datetime import UTC, date, datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.modules.events.services.export_data import EventReportData

# Mapeo de estados internos de liquidaciones a etiquetas legibles
_SETTLEMENT_STATUS_LABELS: dict[str, str] = {
    "confirmed": "Saldado",
    "pending_confirmation": "Pendiente",
}

# Paleta de colores corporativa y moderna
COLOR_PRIMARY = colors.HexColor("#0F172A")       # Slate 900
COLOR_HEADER_BG = colors.HexColor("#1E293B")     # Slate 800
COLOR_SUBHEADER = colors.HexColor("#475569")     # Slate 600
COLOR_ROW_ALT = colors.HexColor("#F8FAFC")       # Slate 50
COLOR_BORDER = colors.HexColor("#E2E8F0")        # Slate 200
COLOR_TEXT = colors.HexColor("#1E293B")          # Slate 800
COLOR_MUTED = colors.HexColor("#64748B")         # Slate 500
COLOR_GREEN = colors.HexColor("#059669")         # Emerald 600
COLOR_RED = colors.HexColor("#DC2626")           # Red 600

# Ancho total imprimible: A4 (595.27 pt) - márgenes (2 * 42.5 pt) = 510.27 pt
PRINTABLE_WIDTH = 510.0


class PdfFormatter:
    """Genera reportes de eventos en formato PDF con ReportLab."""

    def __init__(self) -> None:
        self._styles = getSampleStyleSheet()
        self._init_custom_styles()

    def _init_custom_styles(self) -> None:
        """Configura los estilos de párrafo para tipografía uniforme."""
        self._title_style = ParagraphStyle(
            "DocTitle",
            parent=self._styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=COLOR_PRIMARY,
        )
        self._section_heading = ParagraphStyle(
            "SectionHeading",
            parent=self._styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=COLOR_PRIMARY,
            spaceAfter=6,
        )
        self._meta_label = ParagraphStyle(
            "MetaLabel",
            parent=self._styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=13,
            textColor=COLOR_SUBHEADER,
        )
        self._meta_val = ParagraphStyle(
            "MetaVal",
            parent=self._styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=COLOR_TEXT,
        )
        self._th_style = ParagraphStyle(
            "THStyle",
            parent=self._styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            textColor=colors.white,
        )
        self._th_right = ParagraphStyle(
            "THRight",
            parent=self._th_style,
            alignment=2,  # TA_RIGHT
        )
        self._cell_style = ParagraphStyle(
            "CellStyle",
            parent=self._styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10.5,
            textColor=COLOR_TEXT,
        )
        self._cell_bold = ParagraphStyle(
            "CellBold",
            parent=self._cell_style,
            fontName="Helvetica-Bold",
        )
        self._cell_right = ParagraphStyle(
            "CellRight",
            parent=self._cell_style,
            alignment=2,  # TA_RIGHT
        )
        self._cell_empty = ParagraphStyle(
            "CellEmpty",
            parent=self._cell_style,
            alignment=1,  # TA_CENTER
            textColor=COLOR_MUTED,
            fontName="Helvetica-Oblique",
        )

    def render(self, data: EventReportData) -> bytes:
        """Convierte ``data`` en un stream de bytes PDF válido.

        Args:
            data: Agregado de datos del reporte.

        Returns:
            Contenido binario del PDF.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=42.5,
            rightMargin=42.5,
            topMargin=42.5,
            bottomMargin=50.0,
        )

        elements: list[Any] = []

        # 1. Título y encabezado del evento
        elements.extend(self._build_header(data))
        elements.append(Spacer(1, 14))

        # 2. Balance de participantes
        elements.extend(self._build_member_balances(data))
        elements.append(Spacer(1, 16))

        # 3. Historial de gastos activos
        elements.extend(self._build_expenses(data))
        elements.append(Spacer(1, 16))

        # 4. Estado de liquidaciones
        elements.extend(self._build_settlements(data))

        # Compilación del documento con pie de página dinámico
        doc.build(
            elements,
            onFirstPage=self._draw_page_footer,
            onLaterPages=self._draw_page_footer,
        )

        return buffer.getvalue()

    # ------------------------------------------------------------------
    # Construcción de secciones
    # ------------------------------------------------------------------

    def _build_header(self, data: EventReportData) -> list[Any]:
        header = data.header
        title_p = Paragraph(f"Reporte del Evento: {header.name}", self._title_style)

        meta_data = [
            [
                Paragraph("Moneda base:", self._meta_label),
                Paragraph(header.currency, self._meta_val),
                Paragraph("Estado:", self._meta_label),
                Paragraph(header.status.capitalize(), self._meta_val),
            ],
            [
                Paragraph("Creador:", self._meta_label),
                Paragraph(header.creator_name, self._meta_val),
                Paragraph("Fecha de creación:", self._meta_label),
                Paragraph(self._fmt_date(header.created_at), self._meta_val),
            ],
        ]
        meta_table = Table(
            meta_data,
            colWidths=[100.0, 155.0, 100.0, 155.0],
        )
        meta_table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("BACKGROUND", (0, 0), (-1, -1), COLOR_ROW_ALT),
                    ("BOX", (0, 0), (-1, -1), 1, COLOR_BORDER),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        return [title_p, Spacer(1, 10), meta_table]

    def _build_member_balances(self, data: EventReportData) -> list[Any]:
        heading = Paragraph("Balance de Participantes", self._section_heading)
        col_widths = [150.0, 90.0, 90.0, 90.0, 90.0]

        table_data: list[list[Any]] = [
            [
                Paragraph("Participante", self._th_style),
                Paragraph("Monto Pagado", self._th_right),
                Paragraph("Monto Consumido", self._th_right),
                Paragraph("Diferencia Neta", self._th_right),
                Paragraph("Estado", self._th_style),
            ]
        ]

        if not data.member_balances:
            table_data.append(
                [Paragraph("Sin registros de participantes", self._cell_empty)] * 5
            )
        else:
            for mb in data.member_balances:
                diff_style = self._cell_right
                if mb.net_difference > 0:
                    diff_style = ParagraphStyle("NetPos", parent=self._cell_right, textColor=COLOR_GREEN)
                elif mb.net_difference < 0:
                    diff_style = ParagraphStyle("NetNeg", parent=self._cell_right, textColor=COLOR_RED)

                table_data.append(
                    [
                        Paragraph(mb.display_name, self._cell_bold),
                        Paragraph(self._fmt_amount(mb.total_paid), self._cell_right),
                        Paragraph(self._fmt_amount(mb.total_consumed), self._cell_right),
                        Paragraph(self._fmt_amount(mb.net_difference), diff_style),
                        Paragraph(mb.status.capitalize(), self._cell_style),
                    ]
                )

        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        table.setStyle(self._get_table_style(has_data=bool(data.member_balances), empty_cols=5))
        return [heading, table]

    def _build_expenses(self, data: EventReportData) -> list[Any]:
        heading = Paragraph("Historial de Gastos Activos", self._section_heading)
        col_widths = [65.0, 155.0, 100.0, 70.0, 60.0, 60.0]

        table_data: list[list[Any]] = [
            [
                Paragraph("Fecha", self._th_style),
                Paragraph("Descripción", self._th_style),
                Paragraph("Pagador", self._th_style),
                Paragraph("Categoría", self._th_style),
                Paragraph("Monto", self._th_right),
                Paragraph("División", self._th_style),
            ]
        ]

        if not data.expenses:
            table_data.append([Paragraph("Sin registros de gastos", self._cell_empty)] * 6)
        else:
            for exp in data.expenses:
                table_data.append(
                    [
                        Paragraph(self._fmt_date(exp.expense_date), self._cell_style),
                        Paragraph(exp.description, self._cell_style),
                        Paragraph(exp.payer_name, self._cell_style),
                        Paragraph(exp.category.capitalize(), self._cell_style),
                        Paragraph(self._fmt_amount(exp.amount), self._cell_right),
                        Paragraph(exp.split_type.capitalize(), self._cell_style),
                    ]
                )

        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        table.setStyle(self._get_table_style(has_data=bool(data.expenses), empty_cols=6))
        return [heading, table]

    def _build_settlements(self, data: EventReportData) -> list[Any]:
        heading = Paragraph("Estado de Liquidaciones", self._section_heading)
        col_widths = [130.0, 130.0, 80.0, 90.0, 80.0]

        table_data: list[list[Any]] = [
            [
                Paragraph("Pagador", self._th_style),
                Paragraph("Acreedor", self._th_style),
                Paragraph("Monto", self._th_right),
                Paragraph("Estado", self._th_style),
                Paragraph("Fecha", self._th_style),
            ]
        ]

        if not data.settlements:
            table_data.append(
                [Paragraph("Sin registros de liquidaciones", self._cell_empty)] * 5
            )
        else:
            for st in data.settlements:
                label = _SETTLEMENT_STATUS_LABELS.get(st.status, st.status)
                status_style = self._cell_style
                if st.status == "confirmed":
                    status_style = ParagraphStyle("StConfirmed", parent=self._cell_style, textColor=COLOR_GREEN)
                elif st.status == "pending_confirmation":
                    status_style = ParagraphStyle("StPending", parent=self._cell_style, textColor=COLOR_RED)

                table_data.append(
                    [
                        Paragraph(st.payer_name, self._cell_style),
                        Paragraph(st.creditor_name, self._cell_style),
                        Paragraph(self._fmt_amount(st.amount), self._cell_right),
                        Paragraph(label, status_style),
                        Paragraph(self._fmt_date(st.created_at), self._cell_style),
                    ]
                )

        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        table.setStyle(self._get_table_style(has_data=bool(data.settlements), empty_cols=5))
        return [heading, table]

    # ------------------------------------------------------------------
    # Utilidades y estilos
    # ------------------------------------------------------------------

    @staticmethod
    def _get_table_style(has_data: bool, empty_cols: int = 1) -> TableStyle:
        """Genera el estilo de tabla con cabecera oscura y filas alternadas."""
        commands = [
            ("BACKGROUND", (0, 0), (-1, 0), COLOR_HEADER_BG),
            ("ALIGN", (0, 0), (-1, 0), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("BOX", (0, 0), (-1, -1), 1, COLOR_BORDER),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ]
        if not has_data:
            commands.append(("SPAN", (0, 1), (empty_cols - 1, 1)))
            commands.append(("BACKGROUND", (0, 1), (-1, 1), COLOR_ROW_ALT))
        else:
            commands.append(("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, COLOR_ROW_ALT]))

        return TableStyle(commands)

    @staticmethod
    def _draw_page_footer(canvas: Any, doc: Any) -> None:
        """Dibuja el pie de página uniforme con número de página y fecha de emisión."""
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(COLOR_MUTED)

        now_str = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")
        footer_text = f"Cuentas Claras — Reporte emitido el {now_str}"
        page_text = f"Página {doc.page}"

        canvas.drawString(doc.leftMargin, 25, footer_text)
        canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, 25, page_text)
        canvas.restoreState()

    @staticmethod
    def _fmt_amount(value: object) -> str:
        return f"{value:.2f}"

    @staticmethod
    def _fmt_date(value: date) -> str:
        return value.strftime("%Y-%m-%d")
