from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func
from sqlmodel import Session, select

from app.modules.activity.models.activity import ActivityLog
from app.modules.activity.models.activity_read_receipt import ActivityReadReceipt
from app.modules.events.models.enums import MemberStatus
from app.modules.events.models.event_member import EventMember


class NotificationRepository:
    def __init__(self, session: Session):
        self.session = session

    def _get_active_event_ids(self, user_id: str) -> list[str]:
        """Obtiene la lista de event_id donde el usuario es miembro activo."""
        query = select(EventMember.event_id).where(
            EventMember.user_id == user_id,
            EventMember.status == MemberStatus.ACTIVE,
            EventMember.deleted_at.is_(None),
        )
        return [str(eid) for eid in self.session.exec(query).all()]

    def get_user_notifications(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
        unread_only: bool = False,
    ) -> tuple[list[dict[str, Any]], int, int]:
        """
        Retorna (items, total_count, unread_count) de actividades elegibles para el usuario.
        - Filtra por eventos donde el usuario es miembro activo.
        - Excluye actividades donde el usuario es el propio autor (actor_id != user_id).
        - Incluye actividades dirigidas al usuario o globales del evento.
        - Realiza LEFT JOIN con activity_read_receipt para determinar is_read.
        """
        active_event_ids = self._get_active_event_ids(user_id)
        if not active_event_ids:
            return [], 0, 0

        base_filter = [
            ActivityLog.event_id.in_(active_event_ids),
            ActivityLog.actor_id != user_id,
            (ActivityLog.target_id == user_id) | (ActivityLog.target_id.is_(None)),
            ActivityLog.deleted_at.is_(None),
        ]

        # Conteo de no leídas
        unread_query = (
            select(func.count(ActivityLog.id))
            .outerjoin(
                ActivityReadReceipt,
                (ActivityReadReceipt.activity_id == ActivityLog.id)
                & (ActivityReadReceipt.user_id == user_id),
            )
            .where(*base_filter, ActivityReadReceipt.id.is_(None))
        )
        unread_count = self.session.scalar(unread_query) or 0

        # Conteo total de actividades elegibles
        total_query = select(func.count(ActivityLog.id)).where(*base_filter)
        total = self.session.scalar(total_query) or 0

        # Consulta principal con paginación
        query = (
            select(ActivityLog, ActivityReadReceipt)
            .outerjoin(
                ActivityReadReceipt,
                (ActivityReadReceipt.activity_id == ActivityLog.id)
                & (ActivityReadReceipt.user_id == user_id),
            )
            .where(*base_filter)
        )

        if unread_only:
            query = query.where(ActivityReadReceipt.id.is_(None))

        query = query.order_by(ActivityLog.created_at.desc()).offset(offset).limit(limit)
        results = self.session.exec(query).all()

        items = [
            {
                "activity": activity,
                "is_read": receipt is not None,
                "read_at": receipt.read_at if receipt else None,
            }
            for activity, receipt in results
        ]

        return items, total, unread_count

    def get_unread_count(self, user_id: str) -> int:
        """Retorna el conteo exacto de actividades no leídas para el usuario."""
        active_event_ids = self._get_active_event_ids(user_id)
        if not active_event_ids:
            return 0

        unread_query = (
            select(func.count(ActivityLog.id))
            .outerjoin(
                ActivityReadReceipt,
                (ActivityReadReceipt.activity_id == ActivityLog.id)
                & (ActivityReadReceipt.user_id == user_id),
            )
            .where(
                ActivityLog.event_id.in_(active_event_ids),
                ActivityLog.actor_id != user_id,
                (ActivityLog.target_id == user_id) | (ActivityLog.target_id.is_(None)),
                ActivityLog.deleted_at.is_(None),
                ActivityReadReceipt.id.is_(None),
            )
        )
        return self.session.scalar(unread_query) or 0

    def mark_as_read(self, user_id: str, activity_id: UUID) -> tuple[dict[str, Any] | None, bool]:
        """
        Marca una actividad como leída para el usuario autenticado.
        Retorna (datos_actividad, True) si fue exitoso, o (None, False) si la actividad
        no existe o el usuario no tiene acceso.
        """
        activity = self.session.get(ActivityLog, activity_id)
        if not activity or activity.deleted_at is not None:
            return None, False

        active_event_ids = self._get_active_event_ids(user_id)
        if str(activity.event_id) not in active_event_ids:
            return None, False

        receipt = self.session.exec(
            select(ActivityReadReceipt).where(
                ActivityReadReceipt.user_id == user_id,
                ActivityReadReceipt.activity_id == activity_id,
            )
        ).first()

        if not receipt:
            receipt = ActivityReadReceipt(
                user_id=user_id,
                activity_id=activity_id,
                read_at=datetime.now(UTC),
            )
            self.session.add(receipt)
            self.session.commit()
            self.session.refresh(receipt)

        return {
            "activity": activity,
            "is_read": True,
            "read_at": receipt.read_at,
        }, True

    def mark_all_as_read(self, user_id: str) -> int:
        """Marca como leídas todas las actividades visibles no leídas del usuario."""
        active_event_ids = self._get_active_event_ids(user_id)
        if not active_event_ids:
            return 0

        unread_query = (
            select(ActivityLog.id)
            .outerjoin(
                ActivityReadReceipt,
                (ActivityReadReceipt.activity_id == ActivityLog.id)
                & (ActivityReadReceipt.user_id == user_id),
            )
            .where(
                ActivityLog.event_id.in_(active_event_ids),
                ActivityLog.actor_id != user_id,
                (ActivityLog.target_id == user_id) | (ActivityLog.target_id.is_(None)),
                ActivityLog.deleted_at.is_(None),
                ActivityReadReceipt.id.is_(None),
            )
        )
        unread_ids = self.session.exec(unread_query).all()

        if not unread_ids:
            return 0

        now = datetime.now(UTC)
        for act_id in unread_ids:
            receipt = ActivityReadReceipt(
                user_id=user_id,
                activity_id=act_id,
                read_at=now,
            )
            self.session.add(receipt)

        self.session.commit()
        return len(unread_ids)
