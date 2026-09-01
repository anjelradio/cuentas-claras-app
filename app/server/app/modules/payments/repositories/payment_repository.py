from datetime import UTC, datetime
from uuid import UUID

from sqlmodel import Session, col, desc, select

from app.modules.payments.models.enums import PaymentStatus
from app.modules.payments.models.payment import Payment


class PaymentRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, payment: Payment) -> Payment:
        self.session.add(payment)
        self.session.flush()
        return payment

    def get_by_id(self, payment_id: UUID) -> Payment | None:
        query = select(Payment).where(
            Payment.id == payment_id,
            Payment.deleted_at.is_(None),
        )
        return self.session.exec(query).first()

    def get_latest_by_split(self, split_id: UUID) -> Payment | None:
        query = (
            select(Payment)
            .where(
                Payment.split_id == split_id,
                Payment.deleted_at.is_(None),
            )
            .order_by(desc(Payment.created_at))
        )
        return self.session.exec(query).first()

    def get_pending_by_split(self, split_id: UUID) -> Payment | None:
        query = select(Payment).where(
            Payment.split_id == split_id,
            Payment.status == PaymentStatus.PENDING_CONFIRMATION,
            Payment.deleted_at.is_(None),
        )
        return self.session.exec(query).first()

    def list_by_split_ids(self, split_ids: list[UUID]) -> list[Payment]:
        if not split_ids:
            return []
        query = (
            select(Payment)
            .where(
                col(Payment.split_id).in_(split_ids),
                Payment.deleted_at.is_(None),
            )
            .order_by(desc(Payment.created_at))
        )
        return list(self.session.exec(query).all())

    def update(self, payment: Payment) -> Payment:
        payment.updated_at = datetime.now(UTC)
        self.session.add(payment)
        self.session.flush()
        return payment
