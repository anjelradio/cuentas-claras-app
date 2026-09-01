"""Registro canónico de modelos SQLModel para que Alembic cargue su metadata."""

from sqlmodel import SQLModel

from app.modules.activity.models.activity import ActivityLog
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_invitation import EventInvitation
from app.modules.events.models.event_member import EventMember
from app.modules.events.models.qr_asset_cleanup import QrAssetCleanup

# Los modelos persistentes de módulos futuros se importan aquí antes de migrar.
from app.modules.events.models.user_proxy import User
from app.modules.expenses.models.enums import ExpenseCategory, ExpenseSplitType
from app.modules.expenses.models.expense import Expense
from app.modules.expenses.models.expense_split import ExpenseSplit
from app.modules.payments.models.enums import PaymentMethod, PaymentStatus
from app.modules.payments.models.payment import Payment

__all__ = [
    "SQLModel",
    "User",
    "EventStatus",
    "MemberStatus",
    "Event",
    "EventMember",
    "EventInvitation",
    "QrAssetCleanup",
    "ActivityLog",
    "ExpenseCategory",
    "ExpenseSplitType",
    "Expense",
    "ExpenseSplit",
    "PaymentMethod",
    "PaymentStatus",
    "Payment",
]
