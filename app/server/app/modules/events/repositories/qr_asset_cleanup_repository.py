from datetime import UTC, datetime

from sqlmodel import Session, select

from app.modules.events.models.qr_asset_cleanup import QrAssetCleanup


class QrAssetCleanupRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, cleanup: QrAssetCleanup) -> QrAssetCleanup:
        self.session.add(cleanup)
        return cleanup

    def pending(self) -> list[QrAssetCleanup]:
        statement = select(QrAssetCleanup).where(
            QrAssetCleanup.status == "pending",
            QrAssetCleanup.deleted_at.is_(None),
        )
        return list(self.session.exec(statement))

    def mark_completed(self, cleanup: QrAssetCleanup) -> None:
        cleanup.status = "completed"
        cleanup.last_attempt_at = datetime.now(UTC)
        cleanup.attempt_count += 1
        self.session.add(cleanup)

    def mark_failed(self, cleanup: QrAssetCleanup) -> None:
        cleanup.last_attempt_at = datetime.now(UTC)
        cleanup.attempt_count += 1
        cleanup.last_error_code = "STORAGE_DELETE_FAILED"
        self.session.add(cleanup)

    def commit(self) -> None:
        self.session.commit()
