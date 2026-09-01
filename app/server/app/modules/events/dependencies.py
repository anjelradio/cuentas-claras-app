from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from app.db.core import get_session
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.invitation_repository import InvitationRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.repositories.qr_asset_cleanup_repository import QrAssetCleanupRepository
from app.modules.events.repositories.unit_of_work import EventUnitOfWork
from app.modules.events.services.event_service import EventService
from app.modules.events.services.invitation_service import InvitationService
from app.modules.events.services.member_service import MemberService
from app.modules.events.services.qr_service import QrService

SessionDep = Annotated[Session, Depends(get_session)]


def repositories(session: SessionDep):
    return (
        EventRepository(session),
        MemberRepository(session),
        InvitationRepository(session),
        QrAssetCleanupRepository(session),
        EventUnitOfWork(session),
    )


from app.modules.activity.services.activity import ActivityService


def get_event_service(session: SessionDep) -> EventService:
    events, members, _, _, uow = repositories(session)
    activity = ActivityService(session)
    return EventService(events, members, uow, activity_service=activity)


def get_member_service(session: SessionDep) -> MemberService:
    events, members, invitations, cleanups, uow = repositories(session)
    activity = ActivityService(session)
    return MemberService(events, members, invitations, cleanups, uow, activity_service=activity)


def get_invitation_service(session: SessionDep) -> InvitationService:
    events, members, invitations, _, uow = repositories(session)
    return InvitationService(events, members, invitations, uow)


def get_qr_service(session: SessionDep) -> QrService:
    events, members, _, cleanups, uow = repositories(session)
    return QrService(events, members, cleanups, uow)
