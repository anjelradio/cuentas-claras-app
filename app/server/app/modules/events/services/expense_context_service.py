"""Capacidad pública de Events para reglas de gastos sin exponer persistencia interna."""

from uuid import UUID

from app.core.errors import ForbiddenError
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.schemas.expense_context_schemas import (
    ExpenseEventContext,
    ExpenseMemberContext,
    UserEventMembershipContext,
)
from app.modules.events.services.event_authorization_service import EventAuthorizationService


class ExpenseContextService:
    """Resuelve autorización y miembros que el módulo Expenses puede consumir."""

    def __init__(self, events: EventRepository, members: MemberRepository):
        self.events = events
        self.members = members
        self.authorization = EventAuthorizationService(events, members)

    @staticmethod
    def _member_context(member_id: UUID, user_id: str, name: str | None) -> ExpenseMemberContext:
        return ExpenseMemberContext(id=member_id, user_id=user_id, name=name or "Usuario")

    def require_active_member(self, event_id: UUID, user_id: str) -> ExpenseEventContext:
        event, member = self.authorization.require_active_member(event_id, user_id)
        self.authorization.require_open(event)
        return ExpenseEventContext(
            event_id=event.id,
            owner_user_id=event.user_id,
            current_member=self._member_context(
                member.id, member.user_id, self.events.owner_name(member.user_id)
            ),
        )

    def get_active_members(self, event_id: UUID) -> dict[UUID, ExpenseMemberContext]:
        return {
            member.id: self._member_context(member.id, user.id, user.name)
            for member, user in self.members.list_active_with_users(event_id)
        }

    def get_member(self, member_id: UUID) -> ExpenseMemberContext | None:
        member = self.members.get_by_id(member_id)
        if member is None:
            return None
        return self._member_context(
            member.id, member.user_id, self.events.owner_name(member.user_id)
        )

    def require_expense_editor(
        self, event_id: UUID, created_by_member_id: UUID, user_id: str
    ) -> ExpenseEventContext:
        context = self.require_active_member(event_id, user_id)
        creator = self.get_member(created_by_member_id)
        is_creator = creator is not None and creator.user_id == user_id
        if not (is_creator or context.owner_user_id == user_id):
            raise ForbiddenError(
                "Solo el creador del gasto o el propietario del evento pueden modificar o "
                "eliminar el gasto."
            )
        return context

    def member_name(self, member_id: UUID, fallback: str = "Usuario") -> str:
        member = self.get_member(member_id)
        return member.name if member is not None else fallback

    def actor_name(self, user_id: str) -> str:
        return self.events.owner_name(user_id) or "Usuario"

    def list_user_active_event_memberships(
        self, user_id: str, event_id: UUID | None = None
    ) -> list[UserEventMembershipContext]:
        events_dict = self.events.list_for_active_member(user_id, active_only=True)
        result: list[UserEventMembershipContext] = []
        for ev in events_dict:
            ev_id = ev["id"] if isinstance(ev["id"], UUID) else UUID(str(ev["id"]))
            if event_id is not None and ev_id != event_id:
                continue
            member = self.members.get_by_event_and_user(ev_id, user_id)
            if member:
                result.append(
                    UserEventMembershipContext(
                        event_id=ev_id,
                        event_name=str(ev["name"]),
                        member_id=member.id,
                    )
                )
        return result

