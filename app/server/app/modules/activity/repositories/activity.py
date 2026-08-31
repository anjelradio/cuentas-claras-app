from sqlmodel import Session, select
from typing import List, Tuple
from app.modules.activity.models.activity import ActivityLog

class ActivityRepository:
    def __init__(self, session: Session):
        self.session = session

    def create_activity(self, activity: ActivityLog) -> ActivityLog:
        self.session.add(activity)
        self.session.commit()
        self.session.refresh(activity)
        return activity

    def list_activities(self, event_id: str, limit: int = 20, offset: int = 0) -> Tuple[List[ActivityLog], int]:
        query = select(ActivityLog).where(ActivityLog.event_id == event_id)
        
        # Count total
        # Using a simple count for now since it's just getting the length of matching events.
        # But wait, count should use count().
        from sqlalchemy import func
        count_query = select(func.count()).select_from(ActivityLog).where(ActivityLog.event_id == event_id)
        total = self.session.scalar(count_query) or 0
        
        # Paginate
        query = query.order_by(ActivityLog.created_at.desc()).offset(offset).limit(limit)
        results = self.session.exec(query).all()
        
        return list(results), total
