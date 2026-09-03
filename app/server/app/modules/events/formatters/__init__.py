# Formateadores de exportación del módulo events.
#
# Este paquete contiene utilidades de serialización pura (datos → bytes) para
# los reportes exportables del evento. No acceden a la base de datos ni
# implementan casos de uso; únicamente transforman un `EventReportData` en el
# stream binario del formato solicitado (CSV o PDF).
#
# Módulos disponibles:
#   csv_formatter  — Genera el stream CSV con BOM UTF-8.
#   pdf_formatter  — Genera el stream PDF usando reportlab.

from app.modules.events.formatters.csv_formatter import CsvFormatter
from app.modules.events.formatters.pdf_formatter import PdfFormatter

__all__ = ["CsvFormatter", "PdfFormatter"]
