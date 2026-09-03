"""Repositorio de analítica del evento.

Responsabilidad exclusiva: ejecutar las consultas SQL de agregación necesarias
para construir el dashboard analítico de un evento. Ninguna otra capa (service,
router) accede directamente a la base de datos para este módulo.

Todas las consultas filtran ``Expense.deleted_at IS NULL`` para respetar
la eliminación lógica de gastos (Constitution §IX).
"""

from sqlmodel import Session


class AnalyticsRepository:
    """Acceso a datos de solo lectura para las métricas agregadas del evento."""

    def __init__(self, session: Session):
        self.session = session
