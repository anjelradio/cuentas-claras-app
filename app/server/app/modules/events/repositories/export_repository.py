"""Repositorio para la consolidación y exportación de reportes de eventos.

Responsabilidad exclusiva (Constitution §VIII):
  Ejecutar las consultas SQL necesarias para extraer los datos tabulares del
  evento requeridos para generar reportes portables (CSV / PDF).
  Ninguna otra capa (service, router) contiene SQL directo.

Reglas de integridad y seguridad (Constitution §IX, §XVI):
  - Todos los filtros excluyen registros eliminados lógicamente (deleted_at IS NULL).
  - Todos los montos se mapean y manipulan como ``Decimal``, nunca ``float``.
  - Todas las consultas usan parámetros enlazados tipados para prevenir SQL injection.
  - Solo se incluyen participantes con membresía activa (status = 'ACTIVE').
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy import bindparam, text
from sqlmodel import Session

from app.modules.events.services.export_data import (
    EventHeaderData,
    EventReportData,
    ExpenseRowData,
    MemberBalanceData,
    SettlementRowData,
)


def _parse_date(val: object) -> date:
    """Convierte de forma segura datetime, date o string ISO a date."""
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, date):
        return val
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val).date()
        except ValueError:
            try:
                return date.fromisoformat(val[:10])
            except ValueError:
                pass
    return date.today()


class ExportRepository:
    """Acceso a datos de solo lectura para la generación de reportes del evento."""

    def __init__(self, session: Session):
        self.session = session

    def is_active_member(self, event_id: UUID, user_id: str) -> bool:
        """Valida si un usuario es miembro activo del evento (no eliminado)."""
        query = text(
            """
            SELECT 1
            FROM eventmember
            WHERE event_id = :event_id
              AND user_id = :user_id
              AND UPPER(status) = 'ACTIVE'
              AND deleted_at IS NULL
            """
        ).bindparams(
            bindparam("event_id", type_=sa.Uuid),
            bindparam("user_id", type_=sa.String),
        )
        result = self.session.execute(
            query,
            {"event_id": event_id, "user_id": user_id},
        ).first()
        return result is not None

    def get_event_header(self, event_id: UUID) -> EventHeaderData | None:
        """Obtiene los metadatos generales del evento para el encabezado del reporte.

        Retorna None si el evento no existe o fue eliminado lógicamente.
        """
        query = text(
            """
            SELECT e.name,
                   'Bs.' AS currency,
                   e.status,
                   e.created_at,
                   u.name AS creator_name
            FROM event e
            JOIN "user" u ON e.user_id = u.id
            WHERE e.id = :event_id
              AND e.deleted_at IS NULL
            """
        ).bindparams(bindparam("event_id", type_=sa.Uuid))
        row = self.session.execute(query, {"event_id": event_id}).mappings().first()
        if not row:
            return None

        return EventHeaderData(
            name=str(row["name"]),
            currency=str(row["currency"]),
            status=str(row["status"]).lower(),
            created_at=_parse_date(row["created_at"]),
            creator_name=str(row["creator_name"]),
        )

    def get_member_balances(self, event_id: UUID) -> list[MemberBalanceData]:
        """Obtiene la lista consolidada de participantes y sus balances netos individuales.

        Usa CTEs separadas para el total pagado y el total consumido, evitando
        el producto cartesiano entre gastos y divisiones.
        """
        query = text(
            """
            WITH member_paid AS (
                SELECT paid_by_member_id AS member_id,
                       COALESCE(SUM(amount), 0) AS total_paid
                FROM expense
                WHERE event_id = :event_id
                  AND deleted_at IS NULL
                GROUP BY paid_by_member_id
            ),
            member_consumed AS (
                SELECT es.member_id,
                       COALESCE(SUM(es.assigned_amount), 0) AS total_consumed
                FROM expensesplit es
                JOIN expense e ON es.expense_id = e.id
                WHERE e.event_id = :event_id
                  AND e.deleted_at IS NULL
                  AND es.deleted_at IS NULL
                GROUP BY es.member_id
            )
            SELECT u.name AS display_name,
                   COALESCE(mp.total_paid, 0) AS total_paid,
                   COALESCE(mc.total_consumed, 0) AS total_consumed
            FROM eventmember em
            JOIN "user" u ON em.user_id = u.id
            LEFT JOIN member_paid mp ON mp.member_id = em.id
            LEFT JOIN member_consumed mc ON mc.member_id = em.id
            WHERE em.event_id = :event_id
              AND em.deleted_at IS NULL
              AND UPPER(em.status) = 'ACTIVE'
            ORDER BY u.name ASC
            """
        ).bindparams(bindparam("event_id", type_=sa.Uuid))
        rows = self.session.execute(query, {"event_id": event_id}).mappings().all()
        balances: list[MemberBalanceData] = []
        for row in rows:
            total_paid = Decimal(str(row["total_paid"]))
            total_consumed = Decimal(str(row["total_consumed"]))
            net_difference = total_paid - total_consumed
            if net_difference > Decimal("0"):
                status = "acreedor"
            elif net_difference < Decimal("0"):
                status = "deudor"
            else:
                status = "neutro"

            balances.append(
                MemberBalanceData(
                    display_name=str(row["display_name"]),
                    total_paid=total_paid,
                    total_consumed=total_consumed,
                    net_difference=net_difference,
                    status=status,
                )
            )
        return balances

    def get_expense_rows(self, event_id: UUID) -> list[ExpenseRowData]:
        """Obtiene el historial detallado de gastos activos del evento ordenados por fecha."""
        query = text(
            """
            SELECT e.expense_date,
                   e.name AS description,
                   u.name AS payer_name,
                   e.category,
                   e.amount,
                   e.split_type
            FROM expense e
            JOIN eventmember em ON e.paid_by_member_id = em.id
            JOIN "user" u ON em.user_id = u.id
            WHERE e.event_id = :event_id
              AND e.deleted_at IS NULL
            ORDER BY e.expense_date ASC
            """
        ).bindparams(bindparam("event_id", type_=sa.Uuid))
        rows = self.session.execute(query, {"event_id": event_id}).mappings().all()
        expenses: list[ExpenseRowData] = []
        for row in rows:
            expenses.append(
                ExpenseRowData(
                    expense_date=_parse_date(row["expense_date"]),
                    description=str(row["description"]),
                    payer_name=str(row["payer_name"]),
                    category=str(row["category"]),
                    amount=Decimal(str(row["amount"])),
                    split_type=str(row["split_type"]),
                )
            )
        return expenses

    def get_settlement_rows(self, event_id: UUID) -> list[SettlementRowData]:
        """Obtiene las liquidaciones y pagos entre participantes del evento."""
        query = text(
            """
            SELECT p.status,
                   es.assigned_amount AS amount,
                   u_payer.name AS payer_name,
                   u_creditor.name AS creditor_name,
                   p.created_at
            FROM payment p
            JOIN expensesplit es ON p.split_id = es.id
            JOIN eventmember em_payer ON es.member_id = em_payer.id
            JOIN "user" u_payer ON em_payer.user_id = u_payer.id
            JOIN expense e ON es.expense_id = e.id
            JOIN eventmember em_creditor ON e.paid_by_member_id = em_creditor.id
            JOIN "user" u_creditor ON em_creditor.user_id = u_creditor.id
            WHERE e.event_id = :event_id
              AND e.deleted_at IS NULL
              AND p.deleted_at IS NULL
              AND es.deleted_at IS NULL
            ORDER BY p.created_at DESC
            """
        ).bindparams(bindparam("event_id", type_=sa.Uuid))
        rows = self.session.execute(query, {"event_id": event_id}).mappings().all()
        settlements: list[SettlementRowData] = []
        for row in rows:
            settlements.append(
                SettlementRowData(
                    payer_name=str(row["payer_name"]),
                    creditor_name=str(row["creditor_name"]),
                    amount=Decimal(str(row["amount"])),
                    status=str(row["status"]),
                    created_at=_parse_date(row["created_at"]),
                )
            )
        return settlements

    def get_report_data(self, event_id: UUID) -> EventReportData | None:
        """Consolida todas las secciones del reporte para el evento.

        Retorna None si el evento no existe o está eliminado lógicamente.
        """
        header = self.get_event_header(event_id)
        if header is None:
            return None

        member_balances = self.get_member_balances(event_id)
        expenses = self.get_expense_rows(event_id)
        settlements = self.get_settlement_rows(event_id)

        return EventReportData(
            header=header,
            member_balances=member_balances,
            expenses=expenses,
            settlements=settlements,
        )
