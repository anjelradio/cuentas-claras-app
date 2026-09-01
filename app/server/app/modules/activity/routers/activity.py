from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.core.security import get_current_user
from app.db.core import get_session
from app.modules.activity.schemas.activity import ActivityPaginatedRead, ActivityRead
from app.modules.activity.services.activity import ActivityService

router = APIRouter(prefix="/api/events/{event_id}/activities", tags=["Activities"])


def get_activity_service(session: Session = Depends(get_session)) -> ActivityService:
    return ActivityService(session)


@router.get("", response_model=ActivityPaginatedRead)
def list_activities(
    event_id: UUID,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user),
    service: ActivityService = Depends(get_activity_service),
):
    activities, total = service.get_event_activities(
        event_id=str(event_id), user_id=user_id, limit=limit, offset=offset
    )

    # Map to read schema
    items = []
    for activity in activities:
        items.append(
            ActivityRead(
                id=str(activity.id),
                type=activity.action_type,
                actorName=activity.actor_name,
                targetName=activity.target_name,
                createdAt=activity.created_at,
                description=activity.description,
            )
        )

    has_more = offset + limit < total

    return ActivityPaginatedRead(items=items, total=total, has_more=has_more)
