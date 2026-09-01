from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from app.core.errors import ValidationError
from app.modules.activity.services.activity import ActivityService
from app.modules.events.models.enums import EventStatus, MemberStatus
from app.modules.events.models.event import Event
from app.modules.events.models.event_member import EventMember
from app.modules.events.repositories.event_repository import EventRepository
from app.modules.events.repositories.member_repository import MemberRepository
from app.modules.events.repositories.unit_of_work import EventUnitOfWork
from app.modules.events.schemas.event_schemas import (
    EventCategoryStatItem,
    EventCreateRequest,
    EventStatisticsRead,
    EventUpdateRequest,
    RecentEventRead,
)
from app.modules.events.services.event_authorization_service import EventAuthorizationService



class EventService:
    def __init__(
        self,
        events: EventRepository,
        members: MemberRepository,
        uow: EventUnitOfWork,
        activity_service: ActivityService = None,
    ):
        self.events = events
        self.members = members
        self.uow = uow
        self.activity_service = activity_service
        self.authorization = EventAuthorizationService(events, members)

    def create_event(self, request: EventCreateRequest, user_id: str) -> Event:
        self._validate_date_range(request.starts_at, request.ends_at)
        try:
            event = self.events.create(Event(**request.model_dump(), user_id=user_id))
            self.members.create(
                EventMember(event_id=event.id, user_id=user_id, status=MemberStatus.ACTIVE)
            )

            if self.activity_service:
                actor_name = self.events.owner_name(user_id) or "Usuario"
                self.activity_service.log_activity(
                    event_id=str(event.id),
                    actor_id=user_id,
                    actor_name=actor_name,
                    action_type="event_created",
                    description=f'{actor_name} creó el evento "{event.name}".',
                    target_name=event.name,
                )

            self.uow.commit()
            return event
        except Exception:
            self.uow.rollback()
            raise

    def get_event(self, event_id: UUID, user_id: str) -> Event:
        event, _ = self.authorization.require_active_member(event_id, user_id)
        return event

    def get_event_detail(self, event_id: UUID, user_id: str) -> dict:
        event = self.get_event(event_id, user_id)
        return {
            **event.model_dump(),
            "owner_name": self.events.owner_name(event.user_id),
            "is_owner": event.user_id == user_id,
        }

    def list_user_events(
        self, user_id: str, *, active_only: bool = False
    ) -> list[dict[str, object]]:
        return self.events.list_for_active_member(user_id, active_only=active_only)

    def update_event(self, event_id: UUID, user_id: str, request: EventUpdateRequest) -> Event:
        event, _ = self.authorization.require_owner(event_id, user_id)
        updates = request.model_dump(exclude_unset=True)
        if event.status == EventStatus.CLOSED:
            if set(updates) != {"status"} or updates["status"] != EventStatus.OPEN:
                raise ValidationError(
                    "No se pueden modificar otros campos en un evento cerrado, excepto reabrirlo."
                )
        if "starts_at" in updates or "ends_at" in updates:
            self._validate_date_range(
                updates.get("starts_at", event.starts_at),
                updates.get("ends_at", event.ends_at),
            )
        for field, value in updates.items():
            setattr(event, field, value)

        action_type = "event_updated"
        action_desc = f'Se actualizaron los datos del evento "{event.name}".'
        if updates.get("status") == EventStatus.CLOSED:
            event.closed_at = datetime.now(UTC)
            action_type = "event_closed"
            action_desc = f'Se cerró el evento "{event.name}".'
        elif updates.get("status") == EventStatus.OPEN:
            event.closed_at = None
            action_type = "event_updated"
            action_desc = f'Se reabrió el evento "{event.name}".'

        try:
            updated = self.events.update(event)

            if self.activity_service:
                actor_name = self.events.owner_name(user_id) or "Usuario"
                self.activity_service.log_activity(
                    event_id=str(event.id),
                    actor_id=user_id,
                    actor_name=actor_name,
                    action_type=action_type,
                    description=action_desc,
                    target_name=event.name,
                )

            self.uow.commit()
            return updated
        except Exception:
            self.uow.rollback()
            raise

    @staticmethod
    def _validate_date_range(starts_at: datetime, ends_at: datetime) -> None:
        if ends_at < starts_at:
            raise ValidationError("La fecha de fin no puede ser anterior a la fecha de inicio.")

    def delete_event(self, event_id: UUID, user_id: str) -> None:
        event, _ = self.authorization.require_owner(event_id, user_id)
        self.authorization.require_open(event)
        if any(member.user_id != user_id for member in self.members.get_active_members(event_id)):
            raise ValidationError(
                "No se puede eliminar el evento mientras tenga otros miembros activos."
            )
        try:
            self.events.soft_delete(event)
            self.uow.commit()
        except Exception:
            self.uow.rollback()
            raise

    def transfer_ownership(self, event_id: UUID, user_id: str, new_owner_id: str) -> None:
        event, _ = self.authorization.require_owner(event_id, user_id)
        self.authorization.require_open(event)
        candidate = self.members.get_by_event_and_user(event_id, new_owner_id)
        if candidate is None or candidate.status != MemberStatus.ACTIVE:
            raise ValidationError("El nuevo propietario debe ser un miembro activo del evento.")
        try:
            event.user_id = new_owner_id
            self.events.update(event)

            if self.activity_service:
                actor_name = self.events.owner_name(user_id) or "Usuario"
                target_name = self.events.owner_name(new_owner_id) or "Usuario"
                self.activity_service.log_activity(
                    event_id=str(event.id),
                    actor_id=user_id,
                    actor_name=actor_name,
                    action_type="owner_transferred",
                    description=f"{actor_name} transfirió la administración a {target_name}.",
                    target_id=new_owner_id,
                    target_name=target_name,
                )

            self.uow.commit()
        except Exception:
            self.uow.rollback()
            raise

    def get_recent_events_with_spending(
        self, user_id: str, limit: int = 2
    ) -> list[RecentEventRead]:
        from sqlmodel import col, desc, select

        from app.modules.expenses.models.expense import Expense
        from app.modules.expenses.models.expense_split import ExpenseSplit
        from app.modules.payments.models.enums import PaymentStatus
        from app.modules.payments.models.payment import Payment

        # 1. Obtener los eventos activos del usuario ordenados por fecha de creación desc
        memberships_query = (
            select(EventMember, Event)
            .join(Event, Event.id == EventMember.event_id)
            .where(
                EventMember.user_id == user_id,
                EventMember.status == MemberStatus.ACTIVE,
                EventMember.deleted_at.is_(None),
                Event.deleted_at.is_(None),
            )
            .order_by(desc(Event.created_at))
            .limit(limit)
        )
        rows = self.events.session.exec(memberships_query).all()
        if not rows:
            return []

        recent_events: list[RecentEventRead] = []

        for user_member, event in rows:
            # Miembros activos del evento
            active_members = self.members.get_active_members(event.id)
            member_count = len(active_members)

            # Gastos activos del evento
            expenses = list(
                self.events.session.exec(
                    select(Expense).where(
                        Expense.event_id == event.id,
                        Expense.deleted_at.is_(None),
                    )
                ).all()
            )
            expense_count = len(expenses)

            # Cálculo de gasto personal:
            # 1) En gastos pagados por el usuario: (monto - devolución) si payer_participated
            # 2) En gastos de otros: suma de cuotas asignadas al usuario con pago confirmado
            personal_spent = Decimal("0.00")

            if expenses:
                expense_ids = [e.id for e in expenses]
                splits = list(
                    self.events.session.exec(
                        select(ExpenseSplit).where(
                            col(ExpenseSplit.expense_id).in_(expense_ids),
                            ExpenseSplit.deleted_at.is_(None),
                            ExpenseSplit.member_id == user_member.id,
                        )
                    ).all()
                )
                split_ids = [s.id for s in splits]

                confirmed_split_ids = set()
                if split_ids:
                    payments = list(
                        self.events.session.exec(
                            select(Payment).where(
                                col(Payment.split_id).in_(split_ids),
                                Payment.status == PaymentStatus.CONFIRMED,
                                Payment.deleted_at.is_(None),
                            )
                        ).all()
                    )
                    confirmed_split_ids = {p.split_id for p in payments}

                for expense in expenses:
                    if expense.paid_by_member_id == user_member.id:
                        if expense.payer_participated:
                            personal_spent += (expense.amount - expense.refund_amount)

                for split in splits:
                    if split.id in confirmed_split_ids:
                        personal_spent += split.assigned_amount

            recent_events.append(
                RecentEventRead(
                    id=event.id,
                    name=event.name,
                    icon=event.icon,
                    status=event.status,
                    member_count=member_count,
                    expense_count=expense_count,
                    personal_spent_amount=personal_spent.quantize(Decimal("0.01")),
                    created_at=event.created_at,
                )
            )

        return recent_events

    def get_event_statistics(self, event_id: UUID, user_id: str) -> EventStatisticsRead:
        from sqlmodel import select

        from app.modules.expenses.models.enums import ExpenseCategory
        from app.modules.expenses.models.expense import Expense

        # Validar membresía activa
        self.authorization.require_active_member(event_id, user_id)

        expenses = list(
            self.events.session.exec(
                select(Expense).where(
                    Expense.event_id == event_id,
                    Expense.deleted_at.is_(None),
                )
            ).all()
        )

        total_amount = sum((e.amount for e in expenses), Decimal("0.00")).quantize(Decimal("0.01"))

        category_labels = {
            ExpenseCategory.FOOD: "Comida",
            ExpenseCategory.LODGING: "Hospedaje",
            ExpenseCategory.TRANSPORT: "Transporte",
            ExpenseCategory.SHOPPING: "Compras",
            ExpenseCategory.ENTERTAINMENT: "Entretenimiento",
            ExpenseCategory.OTHER: "Otra",
        }

        # Agrupar por categoría
        grouped: dict[ExpenseCategory, dict] = {}
        for cat in ExpenseCategory:
            grouped[cat] = {"amount": Decimal("0.00"), "count": 0}

        for expense in expenses:
            cat = expense.category
            if cat in grouped:
                grouped[cat]["amount"] += expense.amount
                grouped[cat]["count"] += 1

        categories_stat: list[EventCategoryStatItem] = []
        for cat, data in grouped.items():
            if data["count"] > 0 or total_amount == Decimal("0.00"):
                percentage = 0.0
                if total_amount > Decimal("0.00"):
                    percentage = round(float(data["amount"] / total_amount * 100), 2)
                categories_stat.append(
                    EventCategoryStatItem(
                        category=cat,
                        label=category_labels.get(cat, cat.value.capitalize()),
                        amount=data["amount"].quantize(Decimal("0.01")),
                        percentage=percentage,
                        count=data["count"],
                    )
                )

        # Ordenar categorías con mayor gasto primero
        categories_stat.sort(key=lambda x: x.amount, reverse=True)

        return EventStatisticsRead(
            event_id=event_id,
            total_amount=total_amount,
            currency="Bs.",
            categories=categories_stat,
        )

