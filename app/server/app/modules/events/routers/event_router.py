from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile

from app.core.security import get_current_user
from app.modules.events.dependencies import (
    get_event_service,
    get_invitation_service,
    get_member_service,
    get_qr_service,
)
from app.modules.events.schemas.event_schemas import (
    EventCreateRequest,
    EventDetailRead,
    EventRead,
    EventStatisticsRead,
    EventSummaryRead,
    EventUpdateRequest,
    RecentEventRead,
    TransferOwnershipRequest,
)
from app.modules.events.schemas.invitation_schemas import EventInvitationRead
from app.modules.events.schemas.member_schemas import JoinEventRequest, MemberRead
from app.modules.events.schemas.qr_schemas import MyQrRead
from app.modules.events.services.event_service import EventService
from app.modules.events.services.invitation_service import InvitationService
from app.modules.events.services.member_service import MemberService
from app.modules.events.services.qr_service import QrService

router = APIRouter(prefix="/api/events", tags=["events"])
UserDep = Annotated[str, Depends(get_current_user)]


EventServiceDep = Annotated[EventService, Depends(get_event_service)]
MemberServiceDep = Annotated[MemberService, Depends(get_member_service)]
InvitationServiceDep = Annotated[InvitationService, Depends(get_invitation_service)]
QrServiceDep = Annotated[QrService, Depends(get_qr_service)]


@router.post("", response_model=EventRead, status_code=201)
def create_event(request: EventCreateRequest, user_id: UserDep, service: EventServiceDep):
    return service.create_event(request, user_id)


@router.get("", response_model=list[EventSummaryRead])
def list_events(
    user_id: UserDep,
    service: EventServiceDep,
    active_only: bool = Query(False, description="Limita la lista a eventos abiertos."),
):
    return service.list_user_events(user_id, active_only=active_only)


@router.get("/recent", response_model=list[RecentEventRead])
def get_recent_events(
    user_id: UserDep,
    service: EventServiceDep,
    limit: int = Query(2, ge=1, le=10, description="Cantidad de eventos recientes a retornar"),
):
    return service.get_recent_events_with_spending(user_id, limit=limit)


@router.post("/join")
def join_event(request: JoinEventRequest, user_id: UserDep, service: MemberServiceDep):
    """La ruta estática debe evaluarse antes de `/{event_id}`."""
    service.join_event(request.token_hash, user_id)
    return {"status": "ok"}


@router.get("/{event_id}/statistics", response_model=EventStatisticsRead)
def get_event_statistics(event_id: UUID, user_id: UserDep, service: EventServiceDep):
    return service.get_event_statistics(event_id, user_id)



@router.get("/{event_id}", response_model=EventDetailRead)
def get_event(event_id: UUID, user_id: UserDep, service: EventServiceDep):
    return service.get_event_detail(event_id, user_id)


@router.patch("/{event_id}", response_model=EventRead)
def update_event(
    event_id: UUID,
    request: EventUpdateRequest,
    user_id: UserDep,
    service: EventServiceDep,
):
    return service.update_event(event_id, user_id, request)


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: UUID, user_id: UserDep, service: EventServiceDep):
    service.delete_event(event_id, user_id)


@router.post("/{event_id}/transfer-ownership")
def transfer_ownership(
    event_id: UUID,
    request: TransferOwnershipRequest,
    user_id: UserDep,
    service: EventServiceDep,
):
    service.transfer_ownership(event_id, user_id, request.new_owner_id)
    return {"status": "ok"}


@router.post("/{event_id}/invitations", response_model=EventInvitationRead)
def generate_invitation(event_id: UUID, user_id: UserDep, service: InvitationServiceDep):
    return service.generate_invitation(event_id, user_id)


@router.post("/{event_id}/leave")
def leave_event(event_id: UUID, user_id: UserDep, service: MemberServiceDep):
    service.leave_event(event_id, user_id)
    return {"status": "ok"}


@router.get("/{event_id}/my-qr", response_model=MyQrRead)
def get_my_qr(event_id: UUID, user_id: UserDep, service: QrServiceDep):
    return MyQrRead(image_url=service.get_my_qr(event_id, user_id))


@router.put("/{event_id}/my-qr", response_model=MyQrRead)
async def upsert_my_qr(
    event_id: UUID,
    user_id: UserDep,
    service: QrServiceDep,
    file: UploadFile = File(...),  # noqa: B008 - requerido por la inyección de FastAPI.
):
    content = await file.read()
    return MyQrRead(image_url=service.upsert_my_qr(event_id, user_id, file.content_type, content))


@router.delete("/{event_id}/members/{member_user_id}", status_code=204)
def remove_member(event_id: UUID, member_user_id: str, user_id: UserDep, service: MemberServiceDep):
    service.remove_member(event_id, user_id, member_user_id)


@router.get("/{event_id}/members", response_model=list[MemberRead])
def get_event_members(event_id: UUID, user_id: UserDep, service: MemberServiceDep):
    return service.get_event_members(event_id, user_id)
