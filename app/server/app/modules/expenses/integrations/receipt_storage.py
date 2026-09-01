import logging
from dataclasses import dataclass
from io import BytesIO
from uuid import uuid4

import cloudinary
import cloudinary.uploader
from PIL import Image

from app.core.config import Settings
from app.core.errors import InfrastructureError, ValidationError

logger = logging.getLogger(__name__)

MAX_RECEIPT_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


@dataclass(frozen=True)
class StoredReceipt:
    secure_url: str
    public_id: str


class ExpenseReceiptStorage:
    def __init__(self, settings: Settings):
        credentials = (
            settings.cloudinary_cloud_name,
            settings.cloudinary_api_key,
            settings.cloudinary_api_secret,
        )
        if not all(credentials):
            raise InfrastructureError("Credenciales de almacenamiento no configuradas.")
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True,
        )
        self.folder = settings.cloudinary_receipts_folder

    def validate_file(self, content: bytes, content_type: str | None = None) -> None:
        if len(content) > MAX_RECEIPT_BYTES:
            raise ValidationError("El archivo excede el tamaño máximo permitido de 5 MB.")
        if content_type and content_type.lower() not in ALLOWED_MIME_TYPES:
            raise ValidationError(
                "Formato no permitido. Solo se aceptan imágenes JPEG, PNG y WebP."
            )
        try:
            with Image.open(BytesIO(content)) as img:
                img_format = (img.format or "").lower()
                if img_format not in {"jpeg", "png", "webp"}:
                    raise ValidationError(
                        "Formato de imagen inválido. Solo se aceptan JPEG, PNG y WebP."
                    )
        except ValidationError:
            raise
        except Exception as err:
            raise ValidationError("El archivo enviado no es una imagen válida.") from err

    def upload_receipt(
        self, content: bytes, event_id: str, content_type: str | None = None
    ) -> StoredReceipt:
        self.validate_file(content, content_type)
        try:
            result = cloudinary.uploader.upload(
                BytesIO(content),
                resource_type="image",
                folder=f"{self.folder}/{event_id}",
                public_id=str(uuid4()),
                overwrite=False,
                allowed_formats=list(ALLOWED_EXTENSIONS),
            )
            return StoredReceipt(secure_url=result["secure_url"], public_id=result["public_id"])
        except Exception as error:
            logger.error(
                "Cloudinary receipt upload failed",
                exc_info=(type(error), error, error.__traceback__),
            )
            raise InfrastructureError("Error al subir el comprobante.") from error

    def destroy(self, public_id: str) -> None:
        try:
            cloudinary.uploader.destroy(public_id, resource_type="image", invalidate=True)
        except Exception as error:
            logger.error(
                "Cloudinary receipt deletion failed",
                exc_info=(type(error), error, error.__traceback__),
            )
            raise InfrastructureError("Error al eliminar el comprobante.") from error
