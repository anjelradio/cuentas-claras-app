from app.modules.events.integrations.cloudinary_storage import CloudinaryStorage
from app.modules.events.repositories.qr_asset_cleanup_repository import QrAssetCleanupRepository


class QrCleanupService:
    def __init__(self, repository: QrAssetCleanupRepository, storage: CloudinaryStorage):
        self.repository = repository
        self.storage = storage

    def process_pending(self) -> None:
        for cleanup in self.repository.pending():
            try:
                self.storage.destroy(cleanup.public_id)
                self.repository.mark_completed(cleanup)
            except Exception:
                self.repository.mark_failed(cleanup)
        self.repository.commit()
