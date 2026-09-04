"""Lógica de dominio puro para el cálculo y validación financiera de cuotas de gastos."""

from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID

from app.core.errors import ValidationError
from app.modules.expenses.schemas.expense_schemas import ExpenseSplitRequest

CENT = Decimal("0.01")


class ExpenseSplitCalculator:
    """Calculador de dominio con aritmética de punto fijo en centavos."""

    @staticmethod
    def to_cents(amount: Decimal) -> int:
        """Convierte un monto decimal a centavos enteros."""
        return int((amount.quantize(CENT, rounding=ROUND_HALF_UP) * 100).to_integral_value())

    @staticmethod
    def from_cents(cents: int) -> Decimal:
        """Convierte centavos enteros a un monto decimal quantizado a dos decimales."""
        return (Decimal(cents) / Decimal(100)).quantize(CENT)

    @staticmethod
    def unique_member_ids(member_ids: list[UUID]) -> list[UUID]:
        """Valida que no existan duplicados y retorna la lista ordenada canónicamente."""
        if len(set(member_ids)) != len(member_ids):
            raise ValidationError("No se permiten participantes duplicados en el reparto.")
        return sorted(member_ids)

    @classmethod
    def calculate_equal_distribution(
        cls,
        amount: Decimal,
        other_member_ids: list[UUID],
        payer_member_id: UUID,
        payer_participated: bool,
    ) -> tuple[list[tuple[UUID, Decimal]], Decimal]:
        """Divide equitativamente entre consumidores y omite la cuota del pagador."""
        if amount <= Decimal("0.00"):
            raise ValidationError("El monto del gasto debe ser mayor a 0.")

        others = cls.unique_member_ids(other_member_ids)
        if payer_member_id in others:
            raise ValidationError(
                "El pagador no puede tener una cuota de deuda en su propio gasto."
            )
        if not others and not payer_participated:
            raise ValidationError(
                "Selecciona al menos una persona cuando indicas que no participaste en el gasto."
            )
        if not others:
            return [], Decimal("0.00")

        consumers = ([payer_member_id] if payer_participated else []) + others
        total_cents = cls.to_cents(amount)
        base, remainder = divmod(total_cents, len(consumers))
        amounts_by_member = {
            member_id: base + (1 if index < remainder else 0)
            for index, member_id in enumerate(consumers)
        }
        splits = [
            (member_id, cls.from_cents(amounts_by_member[member_id])) for member_id in others
        ]
        return splits, sum((assigned for _, assigned in splits), Decimal("0.00"))

    @classmethod
    def calculate_equal_splits(
        cls, amount: Decimal, member_ids: list[UUID]
    ) -> list[tuple[UUID, Decimal]]:
        """Compatibilidad de cálculo puro para consumidores sin pagador explícito."""
        if amount <= Decimal("0.00"):
            raise ValidationError("El monto del gasto debe ser mayor a 0.")
        members = cls.unique_member_ids(member_ids)
        if not members:
            raise ValidationError("Debe incluir al menos un participante.")
        total_cents = cls.to_cents(amount)
        base, remainder = divmod(total_cents, len(members))
        return [
            (member_id, cls.from_cents(base + (1 if index < remainder else 0)))
            for index, member_id in enumerate(members)
        ]

    @classmethod
    def calculate_exact_distribution(
        cls,
        amount: Decimal,
        splits_input: list[ExpenseSplitRequest] | list[tuple[UUID, Decimal]],
        payer_member_id: UUID,
        payer_participated: bool,
    ) -> tuple[list[tuple[UUID, Decimal]], Decimal]:
        """Normaliza cuotas positivas y conserva la diferencia como aporte propio."""
        if amount <= Decimal("0.00"):
            raise ValidationError("El monto del gasto debe ser mayor a 0.")
        normalized: list[tuple[UUID, Decimal]] = []
        payer_amount: Decimal | None = None
        seen: set[UUID] = set()
        for item in splits_input:
            member_id = item.member_id if isinstance(item, ExpenseSplitRequest) else item[0]
            assigned = item.assigned_amount if isinstance(item, ExpenseSplitRequest) else item[1]
            assigned = assigned.quantize(CENT, rounding=ROUND_HALF_UP)
            if assigned < Decimal("0.00"):
                raise ValidationError("La cuota asignada no puede ser negativa.")
            if member_id == payer_member_id:
                if not payer_participated:
                    raise ValidationError(
                        "El pagador no puede aparecer si no participó en el gasto."
                    )
                if payer_amount is not None:
                    raise ValidationError("No se permiten participantes duplicados en el reparto.")
                payer_amount = assigned
                continue
            if member_id in seen:
                raise ValidationError("No se permiten participantes duplicados en el reparto.")
            seen.add(member_id)
            if assigned > Decimal("0.00"):
                normalized.append((member_id, assigned))

        refund = sum((assigned for _, assigned in normalized), Decimal("0.00")).quantize(CENT)
        if refund > amount:
            raise ValidationError("La devolución no puede superar el monto total del gasto.")
        if not payer_participated and refund != amount:
            raise ValidationError(
                "Si no participaste, las cuotas de los demás deben cubrir el monto total."
            )
        if payer_participated and payer_amount is not None and payer_amount + refund != amount:
            raise ValidationError(
                "El aporte del pagador y la devolución deben coincidir con el monto total."
            )
        return normalized, refund

    @staticmethod
    def validate_exact_splits(
        amount: Decimal, splits_input: list[tuple[UUID, Decimal]] | list[ExpenseSplitRequest]
    ) -> list[tuple[UUID, Decimal]]:
        """Compatibilidad de la validación histórica usada por pruebas existentes."""
        member_ids = [
            item.member_id if isinstance(item, ExpenseSplitRequest) else item[0]
            for item in splits_input
        ]
        if len(member_ids) != len(set(member_ids)):
            raise ValidationError("No se permiten participantes duplicados en el reparto.")
        normalized = [
            (
                item.member_id if isinstance(item, ExpenseSplitRequest) else item[0],
                (
                    item.assigned_amount if isinstance(item, ExpenseSplitRequest) else item[1]
                ).quantize(CENT),
            )
            for item in splits_input
        ]
        if sum((value for _, value in normalized), Decimal("0.00")) != amount:
            raise ValidationError(
                "La suma de las cuotas asignadas no coincide con el total "
                f"del gasto (Bs. {amount:.2f})."
            )
        return normalized
