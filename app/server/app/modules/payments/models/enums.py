from enum import StrEnum


class PaymentMethod(StrEnum):
    CASH = "cash"
    QR = "qr"


class PaymentStatus(StrEnum):
    PENDING_CONFIRMATION = "pending_confirmation"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
