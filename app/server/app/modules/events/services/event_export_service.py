"""Servicio de dominio para la exportación de reportes de eventos.

Responsabilidad exclusiva (Constitution §VII):
  Coordinar la autorización de acceso, extracción de datos consolidados,
  aplicación de reglas de negocio financieras y delegación al formateador
  correspondiente (CSV / PDF).
  No contiene SQL directo ni llamadas HTTP.
"""

import re
import unicodedata
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from app.core.errors import NotFoundError, ValidationError
from app.modules.events.formatters.csv_formatter import CsvFormatter
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.export_repository import ExportRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.services.event_authorization_service import EventAuthorizationService
from app.modules.events.services.export_data import EventReportData


class EventExportService:
    """Caso de uso de exportación de reporte portable del evento."""

    def __init__(
        self,
        export_repo: ExportRepository,
        event_repo: EventRepository,
        member_repo: MemberRepository,
        csv_formatter: CsvFormatter | None = None,
        pdf_formatter: Any | None = None,
    ):
        self.export_repo = export_repo
        self.event_repo = event_repo
        self.member_repo = member_repo
        self.auth_service = EventAuthorizationService(event_repo, member_repo)
        self.csv_formatter = csv_formatter or CsvFormatter()
        self.pdf_formatter = pdf_formatter

    def generate_report(
        self,
        event_id: UUID,
        user_id: str,
        format: Literal["csv", "pdf"],
    ) -> tuple[bytes, str, str]:
        """Genera el reporte consolidado del evento en el formato especificado.

        Args:
            event_id: Identificador único del evento.
            user_id: Identificador del usuario que solicita la descarga.
            format: Formato portable deseado ('csv' o 'pdf').

        Returns:
            Tupla con:
              - file_bytes: Contenido binario del archivo generado.
              - content_type: Cabecera MIME del archivo.
              - filename: Nombre seguro y descriptivo del archivo para Content-Disposition.

        Raises:
            NotFoundError: Si el evento no existe o fue eliminado lógicamente.
            ForbiddenError: Si el usuario no es un miembro activo del evento.
            ValidationError: Si el formato especificado no está soportado.
        """
        # 1. Autorización de acceso (Constitution §XIV, FR-001)
        self.auth_service.require_active_member(event_id, user_id)

        # 2. Recolección de datos desde el repositorio de exportación
        report_data = self.export_repo.get_report_data(event_id)
        if report_data is None:
            raise NotFoundError("El evento no existe.")

        # 3. Aplicación de lógica financiera de balances en el service (Constitution §XVI)
        self._calculate_member_financials(report_data)

        # 4. Generación del slug descriptivo para el archivo (FR-012)
        slug = self._slugify(report_data.header.name)
        filename = f"{slug}-reporte.{format}"

        # 5. Delegación al formateador según el formato solicitado
        if format == "csv":
            file_bytes = self.csv_formatter.render(report_data)
            content_type = "text/csv; charset=utf-8"
        elif format == "pdf":
            file_bytes = self._render_pdf(report_data)
            content_type = "application/pdf"
        else:
            raise ValidationError(f"Formato no soportado: '{format}'. Debe ser 'csv' o 'pdf'.")

        return file_bytes, content_type, filename

    def _render_pdf(self, report_data: EventReportData) -> bytes:
        """Invoca el formateador PDF de forma diferida si no fue inyectado."""
        if self.pdf_formatter is None:
            try:
                from app.modules.events.formatters.pdf_formatter import PdfFormatter

                self.pdf_formatter = PdfFormatter()
            except (ImportError, ModuleNotFoundError) as err:
                raise ValidationError("El formato PDF aún no está disponible.") from err

        return self.pdf_formatter.render(report_data)

    @staticmethod
    def _calculate_member_financials(report_data: EventReportData) -> None:
        """Garantiza el cálculo exacto de balances individuales en el dominio."""
        for mb in report_data.member_balances:
            mb.net_difference = mb.total_paid - mb.total_consumed
            if mb.net_difference > Decimal("0"):
                mb.status = "acreedor"
            elif mb.net_difference < Decimal("0"):
                mb.status = "deudor"
            else:
                mb.status = "neutro"

    @staticmethod
    def _slugify(text: str) -> str:
        """Normaliza el nombre a un slug seguro para sistemas de archivos (máx 50 chars)."""
        text = unicodedata.normalize("NFKD", text)
        text = text.encode("ascii", "ignore").decode("ascii")
        text = text.lower()
        slug = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
        if not slug:
            slug = "evento"
        return slug[:50]
