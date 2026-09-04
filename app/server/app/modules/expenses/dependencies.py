from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from app.core.config import get_settings
from app.db.core import get_session
from app.modules.activity.services.activity import ActivityService
from app.modules.events.dependencies import get_expense_context_service
from app.modules.expenses.integrations.gemini_analyzer import GeminiReceiptAnalyzer
from app.modules.expenses.integrations.receipt_storage import ExpenseReceiptStorage
from app.modules.expenses.repositories.expense_repository import ExpenseRepository
from app.modules.expenses.repositories.expense_split_repository import ExpenseSplitRepository
from app.modules.expenses.repositories.unit_of_work import ExpenseUnitOfWork
from app.modules.expenses.services.expense_service import ExpenseService
from app.modules.payments.repositories.payment_repository import PaymentRepository

SessionDep = Annotated[Session, Depends(get_session)]


def get_expense_service(session: SessionDep) -> ExpenseService:
    settings = get_settings()
    activity_service = ActivityService(session)

    receipt_storage = None
    if (
        settings.cloudinary_cloud_name
        and settings.cloudinary_api_key
        and settings.cloudinary_api_secret
    ):
        receipt_storage = ExpenseReceiptStorage(settings)

    gemini_analyzer = GeminiReceiptAnalyzer(settings)

    return ExpenseService(
        expense_repo=ExpenseRepository(session),
        split_repo=ExpenseSplitRepository(session),
        uow=ExpenseUnitOfWork(session),
        event_context=get_expense_context_service(session),
        activity_service=activity_service,
        receipt_storage=receipt_storage,
        gemini_analyzer=gemini_analyzer,
        payment_repo=PaymentRepository(session),
    )
