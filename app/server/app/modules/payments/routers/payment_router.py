from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Request, UploadFile

from app.core.errors import ValidationError
from app.core.security import get_current_user
from app.modules.payments.dependencies import get_payment_service
from app.modules.payments.schemas.payment_schemas import (
    PayerQrRead,
    PaymentCreateRequest,
    PaymentRead,
    PaymentRejectRequest,
    PaymentResolutionRead,
    PendingVerificationPaymentRead,
)
from app.modules.payments.services.payment_service import PaymentService

router = APIRouter(prefix="/api", tags=["payments"])
UserDep = Annotated[str, Depends(get_current_user)]
PaymentServiceDep = Annotated[PaymentService, Depends(get_payment_service)]


@router.get("/payments/pending-verification", response_model=list[PendingVerificationPaymentRead])
def get_pending_verification_payments(
    user_id: UserDep,
    service: PaymentServiceDep,
):
    return service.get_pending_verification(user_id)



@router.get("/expenses/{expense_id}/payer-qr", response_model=PayerQrRead)
def get_payer_qr(
    expense_id: UUID,
    user_id: UserDep,
    service: PaymentServiceDep,
):
    return service.get_payer_qr(expense_id, user_id)


@router.post(
    "/expenses/{expense_id}/splits/{split_id}/pay",
    response_model=PaymentRead,
    status_code=201,
)
async def declare_payment(
    expense_id: UUID,
    split_id: UUID,
    user_id: UserDep,
    service: PaymentServiceDep,
    request: Request,
):
    content_type = request.headers.get("content-type", "")
    file_bytes: bytes | None = None
    file_type: str | None = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        data_str = form.get("data")
        if not data_str or not isinstance(data_str, str):
            raise ValidationError(
                "Debe incluir el campo 'data' con los datos del pago en formato JSON."
            )
        create_req = PaymentCreateRequest.model_validate_json(data_str)
        upload_file = form.get("file")
        if upload_file and hasattr(upload_file, "read"):
            file_bytes = await upload_file.read()
            if not file_bytes:
                file_bytes = None
            file_type = getattr(upload_file, "content_type", None)
    else:
        body = await request.json()
        create_req = PaymentCreateRequest.model_validate(body)

    return service.declare_payment(
        expense_id=expense_id,
        split_id=split_id,
        user_id=user_id,
        request_data=create_req,
        file_content=file_bytes,
        content_type=file_type,
    )


@router.post("/payments/{payment_id}/confirm", response_model=PaymentResolutionRead)
def confirm_payment(
    payment_id: UUID,
    user_id: UserDep,
    service: PaymentServiceDep,
):
    return service.confirm_payment(payment_id, user_id)


@router.post("/payments/{payment_id}/reject", response_model=PaymentResolutionRead)
def reject_payment(
    payment_id: UUID,
    user_id: UserDep,
    service: PaymentServiceDep,
    body: PaymentRejectRequest,
):
    return service.reject_payment(payment_id, user_id, body.rejection_reason)
