"""Coordinador del ciclo de vida y compensación de comprobantes en Cloudinary."""

import logging
from uuid import UUID

from app.modules.expenses.integrations.receipt_storage import ExpenseReceiptStorage

logger = logging.getLogger(__name__)


class ExpenseReceiptCoordinator:
    """Gestiona la subida atómica y compensación de comprobantes externos."""

    def __init__(self, receipt_storage: ExpenseReceiptStorage | None = None):
        self.receipt_storage = receipt_storage

    def upload_if_present(
        self,
        receipt_file: tuple[bytes, str] | None,
        event_id: UUID,
        fallback_url: str | None = None,
    ) -> tuple[str | None, str | None]:
        """Sube el comprobante a Cloudinary si se proporciona y retorna (url, public_id)."""
        if receipt_file is not None and self.receipt_storage is not None:
            content, content_type = receipt_file
            stored = self.receipt_storage.upload_receipt(content, str(event_id), content_type)
            return stored.secure_url, stored.public_id
        return fallback_url, None

    def destroy_safely(self, public_id: str | None) -> None:
        """Elimina un recurso de Cloudinary ignorando excepciones para no abortar el flujo."""
        if not public_id or self.receipt_storage is None:
            return
        try:
            self.receipt_storage.destroy(public_id)
        except Exception as ex:
            logger.warning(
                "No se pudo eliminar el recurso en Cloudinary %s: %s", public_id, ex
            )

    def compensate_on_rollback(self, public_id: str | None) -> None:
        """Ejecuta la compensación para eliminar un archivo subido si la transacción SQL falló."""
        self.destroy_safely(public_id)
