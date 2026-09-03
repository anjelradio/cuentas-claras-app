"""Tipos internos de transferencia de datos para el módulo de exportación.

Estos dataclasses son **privados al módulo `events`**. No son schemas Pydantic
ni se serializan a JSON. Viajan entre ``ExportRepository`` y los formateadores
(``CsvFormatter``, ``PdfFormatter``) encapsulando los datos consolidados del
reporte sin exponer detalles de la base de datos.

Reglas de integridad (Constitution §XVI):
  - Todos los campos monetarios usan ``Decimal``; NUNCA ``float``.
  - Los campos de fecha usan ``date`` (no ``datetime``), ya que el reporte
    solo necesita precisión de día.
"""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass
class EventHeaderData:
    """Metadatos del evento para la sección de encabezado del reporte.

    Attributes:
        name: Nombre del evento.
        currency: Moneda base del evento (p. ej. "Bs.").
        status: Estado del evento ("open" | "closed").
        created_at: Fecha de creación del evento (solo día).
        creator_name: Nombre visible del creador del evento.
    """

    name: str
    currency: str
    status: str
    created_at: date
    creator_name: str


@dataclass
class MemberBalanceData:
    """Balance financiero individual de un participante del evento.

    ``net_difference`` y ``status`` son calculados por ``EventExportService``
    a partir de ``total_paid`` y ``total_consumed``, nunca por el repositorio.

    Attributes:
        display_name: Nombre visible del participante.
        total_paid: Suma de los montos de los gastos que pagó el miembro.
        total_consumed: Suma de los montos asignados al miembro en sus splits.
        net_difference: Diferencia neta (total_paid − total_consumed).
            Positivo → acreedor; Negativo → deudor; Cero → neutro.
        status: Etiqueta legible del balance ("acreedor" | "deudor" | "neutro").
    """

    display_name: str
    total_paid: Decimal
    total_consumed: Decimal
    net_difference: Decimal
    status: str


@dataclass
class ExpenseRowData:
    """Fila de un gasto activo del evento en el historial del reporte.

    Solo gastos sin eliminación lógica (deleted_at IS NULL) se incluyen.

    Attributes:
        expense_date: Fecha en que ocurrió el gasto.
        description: Nombre descriptivo del gasto (expense.name).
        payer_name: Nombre del miembro que pagó el gasto.
        category: Categoría del gasto (p. ej. "food", "transport").
        amount: Monto total del gasto.
        split_type: Método de división aplicado (p. ej. "equal", "custom").
    """

    expense_date: date
    description: str
    payer_name: str
    category: str
    amount: Decimal
    split_type: str


@dataclass
class SettlementRowData:
    """Fila de una liquidación (pago entre participantes) del reporte.

    Attributes:
        payer_name: Nombre del miembro que realizó el pago de la cuota.
        creditor_name: Nombre del miembro acreedor que recibe el pago.
        amount: Monto del pago.
        status: Estado del pago ("confirmed" | "pending_confirmation").
        created_at: Fecha en que se registró el pago.
    """

    payer_name: str
    creditor_name: str
    amount: Decimal
    status: str
    created_at: date


@dataclass
class EventReportData:
    """Agregado raíz con todos los datos necesarios para generar el reporte.

    Esta es la única estructura que los formateadores (CSV, PDF) reciben como
    entrada. Garantiza que el servicio recopile todos los datos antes de
    iniciar la serialización, evitando queries adicionales dentro del formatter.

    Attributes:
        header: Metadatos del encabezado del evento.
        member_balances: Lista de balances individuales por participante.
        expenses: Historial de gastos activos ordenados por fecha ascendente.
        settlements: Liquidaciones entre participantes ordenadas por fecha
            descendente.
    """

    header: EventHeaderData
    member_balances: list[MemberBalanceData]
    expenses: list[ExpenseRowData]
    settlements: list[SettlementRowData]
