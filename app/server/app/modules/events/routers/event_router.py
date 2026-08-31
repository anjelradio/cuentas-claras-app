from uuid import UUID
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.db.core import get_session
from app.core.security import get_current_user
from app.modules.events.schemas.event_schemas import (
    EventCreateRequest, 
    EventRead, 
    EventSummaryRead, 
    EventDetailRead
)
from app.modules.events.services.event_service import EventService

router = APIRouter(prefix="/api/events", tags=["events"])

SessionDep = Annotated[Session, Depends(get_session)]
UserDep = Annotated[str, Depends(get_current_user)]

def get_event_service(session: SessionDep) -> EventService:
    return EventService(session)

EventServiceDep = Annotated[EventService, Depends(get_event_service)]

@router.post("", response_model=EventRead, status_code=201)
def create_event(
    request: EventCreateRequest, 
    user_id: UserDep,
    service: EventServiceDep
):
    return service.create_event(request, user_id)

@router.get("", response_model=list[EventSummaryRead])
def list_events(
    user_id: UserDep,
    service: EventServiceDep
):
    return service.list_user_events(user_id)

@router.get("/{event_id}", response_model=EventDetailRead)
def get_event(
    event_id: UUID,
    user_id: UserDep,
    service: EventServiceDep
):
    return service.get_event_detail(event_id, user_id)

from app.modules.events.schemas.event_schemas import EventUpdateRequest, TransferOwnershipRequest

@router.patch("/{event_id}", response_model=EventRead)
def update_event(
    event_id: UUID,
    request: EventUpdateRequest,
    user_id: UserDep,
    service: EventServiceDep
):
    return service.update_event(event_id, user_id, request)

@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: UUID,
    user_id: UserDep,
    service: EventServiceDep
):
    service.delete_event(event_id, user_id)

@router.post("/{event_id}/transfer-ownership")
def transfer_ownership(
    event_id: UUID,
    request: TransferOwnershipRequest,
    user_id: UserDep,
    service: EventServiceDep
):
    service.transfer_ownership(event_id, user_id, request.new_owner_id)
    return {"status": "ok"}

from app.modules.events.schemas.invitation_schemas import EventInvitationRead
from app.modules.events.services.invitation_service import InvitationService

def get_invitation_service(session: SessionDep) -> InvitationService:
    return InvitationService(session)

InvitationServiceDep = Annotated[InvitationService, Depends(get_invitation_service)]

@router.post("/{event_id}/invitations", response_model=EventInvitationRead)
def generate_invitation(
    event_id: UUID,
    user_id: UserDep,
    service: InvitationServiceDep
):
    return service.generate_invitation(event_id, user_id)

from app.modules.events.schemas.member_schemas import JoinEventRequest
from app.modules.events.services.member_service import MemberService

def get_member_service(session: SessionDep) -> MemberService:
    return MemberService(session)

MemberServiceDep = Annotated[MemberService, Depends(get_member_service)]

@router.post("/join")
def join_event(
    request: JoinEventRequest,
    user_id: UserDep,
    service: MemberServiceDep
):
    service.join_event(request.token_hash, user_id)
    return {"status": "ok"}

@router.post("/{event_id}/leave")
def leave_event(
    event_id: UUID,
    user_id: UserDep,
    service: MemberServiceDep
):
    service.leave_event(event_id, user_id)
    return {"status": "ok"}

@router.delete("/{event_id}/members/{member_user_id}", status_code=204)
def remove_member(
    event_id: UUID,
    member_user_id: str,
    user_id: UserDep,
    service: MemberServiceDep
):
    service.remove_member(event_id, user_id, member_user_id)

from app.modules.events.schemas.member_schemas import MemberRead

@router.get("/{event_id}/members", response_model=list[MemberRead])
def get_event_members(
    event_id: UUID,
    user_id: UserDep,
    service: MemberServiceDep
):
    return service.get_event_members(event_id, user_id)
