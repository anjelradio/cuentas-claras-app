import logging
from dataclasses import dataclass
from io import BytesIO
from uuid import uuid4

import cloudinary
import cloudinary.uploader

from app.core.config import Settings
from app.core.errors import InfrastructureError

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class StoredQr:
    secure_url: str
    public_id: str


class CloudinaryStorage:
    def __init__(self, settings: Settings):
        credentials = (
            settings.cloudinary_cloud_name,
            settings.cloudinary_api_key,
            settings.cloudinary_api_secret,
        )
        if not all(credentials):
            raise InfrastructureError()
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True,
        )
        self.folder = settings.cloudinary_qr_folder

    def upload_qr(self, content: bytes, event_id: str) -> StoredQr:
        try:
            result = cloudinary.uploader.upload(
                BytesIO(content),
                resource_type="image",
                folder=f"{self.folder}/{event_id}",
                public_id=str(uuid4()),
                overwrite=False,
                allowed_formats=["jpg", "jpeg", "png", "webp"],
            )
            return StoredQr(secure_url=result["secure_url"], public_id=result["public_id"])
        except Exception as error:
            logger.error(
                "Cloudinary QR upload failed",
                exc_info=(type(error), error, error.__traceback__),
            )
            raise InfrastructureError() from error

    def destroy(self, public_id: str) -> None:
        try:
            cloudinary.uploader.destroy(public_id, resource_type="image", invalidate=True)
        except Exception as error:
            logger.error(
                "Cloudinary QR deletion failed",
                exc_info=(type(error), error, error.__traceback__),
            )
            raise InfrastructureError() from error
