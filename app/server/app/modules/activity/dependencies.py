from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from app.db.core import get_session
from app.modules.activity.services.activity import ActivityService
from app.modules.activity.services.notification_service import NotificationService

SessionDep = Annotated[Session, Depends(get_session)]


def get_activity_service(session: SessionDep) -> ActivityService:
    return ActivityService(session)


def get_notification_service(session: SessionDep) -> NotificationService:
    return NotificationService(session)
