from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.core.security import get_current_user
from app.modules.activity.dependencies import get_notification_service
from app.modules.activity.schemas.notification_schemas import (
    BatchReadResponse,
    NotificationListResponse,
    NotificationRead,
    UnreadCountResponse,
)
from app.modules.activity.services.notification_service import NotificationService

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

UserDep = Annotated[str, Depends(get_current_user)]
NotificationServiceDep = Annotated[NotificationService, Depends(get_notification_service)]


@router.get("", response_model=NotificationListResponse)
def get_notifications(
    user_id: UserDep,
    service: NotificationServiceDep,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    unread_only: bool = Query(False),
) -> NotificationListResponse:
    """Obtiene el listado paginado de notificaciones para el usuario autenticado."""
    return service.get_user_notifications(
        user_id=user_id,
        limit=limit,
        offset=offset,
        unread_only=unread_only,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    user_id: UserDep,
    service: NotificationServiceDep,
) -> UnreadCountResponse:
    """Retorna la cantidad de notificaciones no leídas del usuario autenticado."""
    return service.get_unread_count(user_id=user_id)


@router.patch("/{activity_id}/read", response_model=NotificationRead)
def mark_notification_read(
    activity_id: UUID,
    user_id: UserDep,
    service: NotificationServiceDep,
) -> NotificationRead:
    """Marca una notificación individual como leída."""
    return service.mark_as_read(user_id=user_id, activity_id=activity_id)


@router.post("/mark-all-read", response_model=BatchReadResponse, status_code=status.HTTP_200_OK)
def mark_all_notifications_read(
    user_id: UserDep,
    service: NotificationServiceDep,
) -> BatchReadResponse:
    """Marca en lote todas las notificaciones pendientes del usuario como leídas."""
    return service.mark_all_as_read(user_id=user_id)
