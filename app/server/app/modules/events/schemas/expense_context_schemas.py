"""Contratos públicos de Events consumidos por el módulo Expenses."""

from uuid import UUID

from pydantic import BaseModel


class ExpenseMemberContext(BaseModel):
    """Representa la información mínima de un miembro necesaria para gastos."""

    id: UUID
    user_id: str
    name: str


class ExpenseEventContext(BaseModel):
    """Contexto autorizado de evento para un caso de uso del módulo Expenses."""

    event_id: UUID
    owner_user_id: str
    current_member: ExpenseMemberContext


class UserEventMembershipContext(BaseModel):
    """Membresía activa de un usuario en un evento abierto."""

    event_id: UUID
    event_name: str
    member_id: UUID

