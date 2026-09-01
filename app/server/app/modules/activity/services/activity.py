from sqlmodel import Session

from app.modules.activity.models.activity import ActivityLog
from app.modules.activity.repositories.activity import ActivityRepository
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.services.event_authorization_service import EventAuthorizationService


class ActivityService:
    def __init__(self, session: Session):
        self.session = session
        self.repository = ActivityRepository(session)
        self.events = EventRepository(session)
        self.members = MemberRepository(session)
        self.authorization = EventAuthorizationService(self.events, self.members)

    def log_activity(
        self,
        event_id: str,
        actor_id: str,
        actor_name: str,
        action_type: str,
        description: str,
        target_id: str | None = None,
        target_name: str | None = None,
    ) -> ActivityLog:
        """
        Creates and persists a new activity log entry.
        Designed to be called synchronously by other modules.
        """
        activity = ActivityLog(
            event_id=event_id,
            actor_id=actor_id,
            actor_name=actor_name,
            action_type=action_type,
            description=description,
            target_id=target_id,
            target_name=target_name,
        )
        return self.repository.create_activity(activity)

    def get_event_activities(
        self, event_id: str, user_id: str, limit: int = 20, offset: int = 0
    ) -> tuple[list[ActivityLog], int]:
        """
        Gets paginated activities for an event after checking authorization.
        """
        from app.core.errors import ForbiddenError, NotFoundError

        print(f"[DEBUG] Fetching activities for event {event_id} by user {user_id}")
        try:
            self.authorization.require_active_member(event_id, user_id)
            print(f"[DEBUG] User {user_id} authorized for event {event_id}")
        except ForbiddenError:
            print(f"[DEBUG] User {user_id} FORBIDDEN for event {event_id}")
            raise NotFoundError("El evento no existe o no tienes acceso.")
        return self.repository.list_activities(event_id, limit, offset)

    def get_user_recent_activities(
        self, user_id: str, limit: int = 3
    ) -> list[ActivityLog]:
        from sqlmodel import col, desc, select

        from app.modules.events.models.enums import MemberStatus
        from app.modules.events.models.event_member import EventMember

        memberships = list(
            self.session.exec(
                select(EventMember).where(
                    EventMember.user_id == user_id,
                    EventMember.status == MemberStatus.ACTIVE,
                    EventMember.deleted_at.is_(None),
                )
            ).all()
        )
        if not memberships:
            return []

        event_ids = [str(m.event_id) for m in memberships]
        return list(
            self.session.exec(
                select(ActivityLog)
                .where(col(ActivityLog.event_id).in_(event_ids))
                .order_by(desc(ActivityLog.created_at))
                .limit(limit)
            ).all()
        )

