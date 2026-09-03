from typing import Any
from uuid import UUID

from sqlmodel import Session

from app.core.errors import NotFoundError
from app.modules.activity.models.activity import ActivityLog
from app.modules.activity.repositories.notification_repository import NotificationRepository
from app.modules.activity.schemas.notification_schemas import (
    BatchReadResponse,
    NotificationListResponse,
    NotificationRead,
    UnreadCountResponse,
)

ACTION_TITLES: dict[str, str] = {
    "expense.created": "Nuevo gasto registrado",
    "expense.updated": "Gasto modificado",
    "expense.deleted": "Gasto anulado",
    "payment.submitted": "Pago recibido por confirmar",
    "payment.confirmed": "Pago confirmado",
    "payment.rejected": "Pago rechazado",
    "member.joined": "Nuevo participante en el evento",
    "member.left": "Participante salió del evento",
    "member.removed": "Participante removido del evento",
    "event.created": "Evento creado",
    "event.updated": "Evento actualizado",
    "event.ownership_transferred": "Propiedad de evento transferida",
}


class NotificationService:
    def __init__(self, session: Session):
        self.session = session
        self.repository = NotificationRepository(session)

    @staticmethod
    def resolve_title(action_type: str) -> str:
        return ACTION_TITLES.get(action_type, "Aviso del sistema")

    @staticmethod
    def resolve_target_path(action_type: str, event_id: str, target_id: str | None = None) -> str:
        return f"/events/{event_id}"

    def _to_dto(self, data: dict[str, Any]) -> NotificationRead:
        activity: ActivityLog = data["activity"]
        title = self.resolve_title(activity.action_type)
        target_path = self.resolve_target_path(
            activity.action_type, str(activity.event_id), activity.target_id
        )
        return NotificationRead(
            id=activity.id,
            event_id=str(activity.event_id),
            actor_id=activity.actor_id,
            actor_name=activity.actor_name,
            target_id=activity.target_id,
            target_name=activity.target_name,
            action_type=activity.action_type,
            title=title,
            description=activity.description or title,
            target_path=target_path,
            is_read=data["is_read"],
            read_at=data["read_at"],
            created_at=activity.created_at,
        )

    def get_user_notifications(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
        unread_only: bool = False,
    ) -> NotificationListResponse:
        items_data, total, unread_count = self.repository.get_user_notifications(
            user_id=user_id,
            limit=limit,
            offset=offset,
            unread_only=unread_only,
        )
        return NotificationListResponse(
            items=[self._to_dto(item) for item in items_data],
            unread_count=unread_count,
            total=total,
        )

    def get_unread_count(self, user_id: str) -> UnreadCountResponse:
        count = self.repository.get_unread_count(user_id)
        return UnreadCountResponse(unread_count=count)

    def mark_as_read(self, user_id: str, activity_id: UUID) -> NotificationRead:
        data, success = self.repository.mark_as_read(user_id, activity_id)
        if not success or not data:
            raise NotFoundError("La notificación no existe o no tienes acceso.")
        return self._to_dto(data)

    def mark_all_as_read(self, user_id: str) -> BatchReadResponse:
        marked_count = self.repository.mark_all_as_read(user_id)
        return BatchReadResponse(marked_count=marked_count, status="ok")
