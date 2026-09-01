from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from app.core.config import get_settings
from app.db.core import get_session
from app.modules.activity.services.activity import ActivityService
from app.modules.events.dependencies import get_expense_context_service
from app.modules.expenses.integrations.receipt_storage import ExpenseReceiptStorage
from app.modules.expenses.repositories.expense_repository import ExpenseRepository
from app.modules.expenses.repositories.expense_split_repository import ExpenseSplitRepository
from app.modules.payments.repositories.payment_repository import PaymentRepository
from app.modules.payments.repositories.unit_of_work import PaymentUnitOfWork
from app.modules.payments.services.payment_service import PaymentService

SessionDep = Annotated[Session, Depends(get_session)]


def get_payment_service(session: SessionDep) -> PaymentService:
    settings = get_settings()
    activity_service = ActivityService(session)

    proof_storage = None
    if (
        settings.cloudinary_cloud_name
        and settings.cloudinary_api_key
        and settings.cloudinary_api_secret
    ):
        proof_storage = ExpenseReceiptStorage(settings)

    return PaymentService(
        payment_repo=PaymentRepository(session),
        split_repo=ExpenseSplitRepository(session),
        expense_repo=ExpenseRepository(session),
        uow=PaymentUnitOfWork(session),
        event_context=get_expense_context_service(session),
        activity_service=activity_service,
        proof_storage=proof_storage,
    )
