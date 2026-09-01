from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile

from app.core.errors import ValidationError
from app.core.security import get_current_user
from app.modules.expenses.dependencies import get_expense_service
from app.modules.expenses.schemas.expense_schemas import (
    ExpenseCreateRequest,
    ExpenseDetailRead,
    ExpenseRead,
    ExpenseReceiptRead,
    ExpenseSummaryRead,
    ExpenseUpdateRequest,
)
from app.modules.expenses.services.expense_service import ExpenseService

router = APIRouter(prefix="/api", tags=["expenses"])
UserDep = Annotated[str, Depends(get_current_user)]
ExpenseServiceDep = Annotated[ExpenseService, Depends(get_expense_service)]


@router.post("/events/{event_id}/expenses", response_model=ExpenseRead, status_code=201)
async def create_expense(
    event_id: UUID,
    user_id: UserDep,
    service: ExpenseServiceDep,
    request: Request,
):
    content_type = request.headers.get("content-type", "")
    receipt_tuple: tuple[bytes, str] | None = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        data_str = form.get("data")
        if not data_str or not isinstance(data_str, str):
            raise ValidationError(
                "Debe incluir el campo 'data' con los datos del gasto en formato JSON."
            )
        create_req = ExpenseCreateRequest.model_validate_json(data_str)
        upload_file = form.get("file")
        if upload_file and hasattr(upload_file, "read"):
            content = await upload_file.read()
            if content:
                receipt_tuple = (
                    content,
                    getattr(upload_file, "content_type", None) or "image/jpeg",
                )
    else:
        body = await request.json()
        create_req = ExpenseCreateRequest.model_validate(body)

    return service.create_expense(event_id, user_id, create_req, receipt_file=receipt_tuple)


@router.get("/events/{event_id}/expenses", response_model=list[ExpenseSummaryRead])
def list_expenses(
    event_id: UUID,
    user_id: UserDep,
    service: ExpenseServiceDep,
    filter: str = Query("all", description="Filtro de gastos: all | mine | others"),
):
    return service.list_event_expenses(event_id, user_id, filter_type=filter)


@router.get("/expenses/{expense_id}", response_model=ExpenseDetailRead)
def get_expense(expense_id: UUID, user_id: UserDep, service: ExpenseServiceDep):
    return service.get_expense_detail(expense_id, user_id)


@router.patch("/expenses/{expense_id}", response_model=ExpenseDetailRead)
async def update_expense(
    expense_id: UUID,
    user_id: UserDep,
    service: ExpenseServiceDep,
    request: Request,
):
    content_type = request.headers.get("content-type", "")
    receipt_tuple: tuple[bytes, str] | None = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        data_str = form.get("data")
        if not data_str or not isinstance(data_str, str):
            raise ValidationError(
                "Debe incluir el campo 'data' con los datos del gasto en formato JSON."
            )
        update_req = ExpenseUpdateRequest.model_validate_json(data_str)
        upload_file = form.get("file")
        if upload_file and hasattr(upload_file, "read"):
            content = await upload_file.read()
            if content:
                receipt_tuple = (
                    content,
                    getattr(upload_file, "content_type", None) or "image/jpeg",
                )
    else:
        body = await request.json()
        update_req = ExpenseUpdateRequest.model_validate(body)

    return service.update_expense(expense_id, user_id, update_req, receipt_file=receipt_tuple)


@router.delete("/expenses/{expense_id}", status_code=204)
def delete_expense(expense_id: UUID, user_id: UserDep, service: ExpenseServiceDep):
    service.delete_expense(expense_id, user_id)


@router.put("/expenses/{expense_id}/receipt", response_model=ExpenseReceiptRead)
async def upload_expense_receipt(
    expense_id: UUID,
    user_id: UserDep,
    service: ExpenseServiceDep,
    file: Annotated[UploadFile, File()],
):
    content = await file.read()
    return service.replace_receipt(expense_id, user_id, content, file.content_type)


@router.delete("/expenses/{expense_id}/receipt", status_code=204)
def delete_receipt(expense_id: UUID, user_id: UserDep, service: ExpenseServiceDep):
    service.delete_receipt(expense_id, user_id)
