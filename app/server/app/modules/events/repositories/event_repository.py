from uuid import UUID
from sqlmodel import Session, select
from app.modules.events.models.event import Event
from app.modules.events.models.enums import EventStatus

class EventRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, event: Event) -> Event:
        self.session.add(event)
        self.session.commit()
        self.session.refresh(event)
        return event

    def get_by_id(self, event_id: UUID) -> Event | None:
        statement = select(Event).where(Event.id == event_id, Event.deleted_at == None)
        return self.session.exec(statement).first()

    def update(self, event: Event) -> Event:
        self.session.add(event)
        self.session.commit()
        self.session.refresh(event)
        return event

    def soft_delete(self, event: Event) -> None:
        from datetime import datetime, UTC
        event.deleted_at = datetime.now(UTC)
        self.session.add(event)
        self.session.commit()
