from io import BytesIO
from uuid import UUID

from PIL import Image, UnidentifiedImageError

from app.core.config import get_settings
from app.core.errors import ValidationError
from app.modules.events.integrations.cloudinary_storage import CloudinaryStorage
from app.modules.events.models.qr_asset_cleanup import QrAssetCleanup
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.repositories.qr_asset_cleanup_repository import QrAssetCleanupRepository
from app.modules.events.repositories.unit_of_work import EventUnitOfWork
from app.modules.events.services.event_authorization_service import EventAuthorizationService
from app.modules.events.services.qr_cleanup_service import QrCleanupService

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_QR_BYTES = 5 * 1024 * 1024


class QrService:
    def __init__(
        self,
        events: EventRepository,
        members: MemberRepository,
        cleanups: QrAssetCleanupRepository,
        uow: EventUnitOfWork,
        storage: CloudinaryStorage | None = None,
    ):
        self.members, self.cleanups, self.uow = members, cleanups, uow
        self.authorization = EventAuthorizationService(events, members)
        self.storage = storage

    def _storage(self) -> CloudinaryStorage:
        return self.storage or CloudinaryStorage(get_settings())

    def get_my_qr(self, event_id: UUID, user_id: str) -> str | None:
        _, member = self.authorization.require_active_member(event_id, user_id)
        return member.qr_image

    def upsert_my_qr(
        self, event_id: UUID, user_id: str, content_type: str | None, content: bytes
    ) -> str:
        event, member = self.authorization.require_active_member(event_id, user_id)
        self.authorization.require_open(event)
        if content_type not in ALLOWED_CONTENT_TYPES or not content or len(content) > MAX_QR_BYTES:
            raise ValidationError("La imagen debe ser JPEG, PNG o WebP y no superar 5 MB.")
        if not self._matches_declared_image_type(content_type, content):
            raise ValidationError("El archivo no contiene una imagen QR válida.")
        storage = self._storage()
        stored = storage.upload_qr(content, str(event_id))
        previous = member.qr_image_public_id
        try:
            self.members.update_qr(member, stored.secure_url, stored.public_id)
            if previous:
                self.cleanups.create(
                    QrAssetCleanup(
                        event_member_id=member.id, public_id=previous, reason="replacement"
                    )
                )
            self.uow.commit()
        except Exception:
            self.uow.rollback()
            try:
                storage.destroy(stored.public_id)
            except Exception:
                pass
            raise
        QrCleanupService(self.cleanups, storage).process_pending()
        return stored.secure_url

    @staticmethod
    def _matches_declared_image_type(content_type: str, content: bytes) -> bool:
        expected = {"image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WEBP"}.get(
            content_type
        )
        if expected is None:
            return False
        try:
            with Image.open(BytesIO(content)) as image:
                image.verify()
                return image.format == expected
        except (UnidentifiedImageError, OSError, ValueError):
            return False
