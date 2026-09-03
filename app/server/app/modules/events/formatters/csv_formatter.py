"""Formateador CSV para reportes de eventos.

Transforma un ``EventReportData`` en un stream de bytes CSV con las
siguientes características (contrato export-api.md):

  - Delimitador: coma (``,``)
  - Codificación: UTF-8 con BOM (``\\ufeff``) para compatibilidad con Excel
  - Salto de línea: ``\\r\\n`` (estándar RFC 4180)
  - Montos: dos decimales sin símbolo de moneda (p. ej. ``"150.00"``)
  - Fechas: ``YYYY-MM-DD``
  - Estado de liquidaciones: ``"Saldado"`` para ``confirmed``,
    ``"Pendiente"`` para ``pending_confirmation``

Estructura de secciones generadas:
  1. Encabezado del evento (pares clave-valor)
  2. Balance de participantes (tabla)
  3. Historial de gastos (tabla)
  4. Estado de liquidaciones (tabla)
"""

import csv
import io
from datetime import date

from app.modules.events.services.export_data import EventReportData

# Mapeo de estados internos de liquidaciones a etiquetas legibles (contrato §6)
_SETTLEMENT_STATUS_LABELS: dict[str, str] = {
    "confirmed": "Saldado",
    "pending_confirmation": "Pendiente",
}


class CsvFormatter:
    """Genera el reporte en formato CSV a partir de un ``EventReportData``.

    No accede a la base de datos ni tiene estado mutable entre llamadas;
    cada invocación de ``render`` produce un stream independiente.
    """

    def render(self, data: EventReportData) -> bytes:
        """Transforma ``data`` en un archivo CSV como bytes con BOM UTF-8.

        Args:
            data: Agregado raíz con todos los datos del reporte del evento.

        Returns:
            Bytes del archivo CSV, precedidos por el BOM UTF-8 (``\\ufeff``),
            listos para ser entregados como ``StreamingResponse`` o escritos
            en disco.
        """
        buffer = io.StringIO()
        writer = csv.writer(buffer, lineterminator="\r\n")

        self._write_event_header(writer, data)
        self._write_blank_row(writer)
        self._write_member_balances(writer, data)
        self._write_blank_row(writer)
        self._write_expense_rows(writer, data)
        self._write_blank_row(writer)
        self._write_settlement_rows(writer, data)

        # Codificar a bytes y anteponer BOM UTF-8 (contrato §7 / data-model.md)
        csv_bytes = buffer.getvalue().encode("utf-8")
        return "\ufeff".encode("utf-8") + csv_bytes

    # ------------------------------------------------------------------
    # Secciones privadas
    # ------------------------------------------------------------------

    def _write_event_header(self, writer: csv.writer, data: EventReportData) -> None:
        """Sección 1 — Metadatos del evento (pares clave-valor)."""
        header = data.header
        writer.writerow(["Evento", header.name])
        writer.writerow(["Moneda", header.currency])
        writer.writerow(["Estado", header.status])
        writer.writerow(["Creador", header.creator_name])
        writer.writerow(["Fecha de creación", self._fmt_date(header.created_at)])

    def _write_member_balances(self, writer: csv.writer, data: EventReportData) -> None:
        """Sección 2 — Tabla de balances individuales de participantes."""
        writer.writerow(
            ["Participante", "Monto Pagado", "Monto Consumido", "Diferencia Neta", "Estado"]
        )
        for mb in data.member_balances:
            writer.writerow(
                [
                    mb.display_name,
                    self._fmt_amount(mb.total_paid),
                    self._fmt_amount(mb.total_consumed),
                    self._fmt_amount(mb.net_difference),
                    mb.status,
                ]
            )
        if not data.member_balances:
            writer.writerow(["Sin registros"])

    def _write_expense_rows(self, writer: csv.writer, data: EventReportData) -> None:
        """Sección 3 — Tabla del historial de gastos activos."""
        writer.writerow(
            ["Fecha", "Descripción", "Pagador", "Categoría", "Monto", "Método de División"]
        )
        for exp in data.expenses:
            writer.writerow(
                [
                    self._fmt_date(exp.expense_date),
                    exp.description,
                    exp.payer_name,
                    exp.category,
                    self._fmt_amount(exp.amount),
                    exp.split_type,
                ]
            )
        if not data.expenses:
            writer.writerow(["Sin registros"])

    def _write_settlement_rows(self, writer: csv.writer, data: EventReportData) -> None:
        """Sección 4 — Tabla del estado de liquidaciones entre participantes.

        Convierte los estados internos a etiquetas legibles según contrato §6:
        ``confirmed`` → ``"Saldado"``, ``pending_confirmation`` → ``"Pendiente"``.
        """
        writer.writerow(["Pagador", "Acreedor", "Monto", "Estado", "Fecha"])
        for st in data.settlements:
            label = _SETTLEMENT_STATUS_LABELS.get(st.status, st.status)
            writer.writerow(
                [
                    st.payer_name,
                    st.creditor_name,
                    self._fmt_amount(st.amount),
                    label,
                    self._fmt_date(st.created_at),
                ]
            )
        if not data.settlements:
            writer.writerow(["Sin registros"])

    @staticmethod
    def _write_blank_row(writer: csv.writer) -> None:
        """Inserta una fila vacía como separador visual entre secciones."""
        writer.writerow([])

    @staticmethod
    def _fmt_amount(value: object) -> str:
        """Formatea un Decimal a string con dos decimales, sin símbolo de moneda.

        Contrato §4: p. ej. ``Decimal('150')`` → ``"150.00"``.
        """
        return f"{value:.2f}"

    @staticmethod
    def _fmt_date(value: date) -> str:
        """Formatea una fecha a ``YYYY-MM-DD`` (contrato §5)."""
        return value.strftime("%Y-%m-%d")
