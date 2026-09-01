from decimal import Decimal
from uuid import UUID

import pytest

from app.core.errors import ValidationError
from app.modules.expenses.schemas.expense_schemas import ExpenseSplitRequest
from app.modules.expenses.services.expense_service import ExpenseService


PAYER = UUID("00000000-0000-0000-0000-000000000001")
MEMBER_A = UUID("00000000-0000-0000-0000-000000000002")
MEMBER_B = UUID("00000000-0000-0000-0000-000000000003")


def test_equal_split_keeps_the_payer_out_of_debt_and_uses_deterministic_cents():
    splits, refund = ExpenseService.calculate_equal_distribution(
        Decimal("100.00"), [MEMBER_B, MEMBER_A], PAYER, True
    )

    assert splits == [(MEMBER_A, Decimal("33.33")), (MEMBER_B, Decimal("33.33"))]
    assert refund == Decimal("66.66")


def test_equal_split_allows_a_personal_expense():
    splits, refund = ExpenseService.calculate_equal_distribution(
        Decimal("15.00"), [], PAYER, True
    )

    assert splits == []
    assert refund == Decimal("0.00")


def test_equal_split_requires_another_member_when_payer_did_not_participate():
    with pytest.raises(ValidationError, match="Selecciona al menos una persona"):
        ExpenseService.calculate_equal_distribution(Decimal("15.00"), [], PAYER, False)


def test_exact_split_uses_payer_amount_only_for_total_validation():
    splits, refund = ExpenseService.calculate_exact_distribution(
        Decimal("10.00"),
        [ExpenseSplitRequest(member_id=PAYER, assigned_amount=Decimal("10.00"))],
        PAYER,
        True,
    )
    assert splits == []
    assert refund == Decimal("0.00")

    with pytest.raises(ValidationError, match="no puede aparecer"):
        ExpenseService.calculate_exact_distribution(
            Decimal("10.00"),
            [ExpenseSplitRequest(member_id=PAYER, assigned_amount=Decimal("10.00"))],
            PAYER,
            False,
        )

    with pytest.raises(ValidationError, match="cubrir el monto total"):
        ExpenseService.calculate_exact_distribution(
            Decimal("10.00"), [ExpenseSplitRequest(member_id=MEMBER_A, assigned_amount=Decimal("5.00"))], PAYER, False
        )


def test_exact_split_omits_zero_values_and_derives_contribution():
    splits, refund = ExpenseService.calculate_exact_distribution(
        Decimal("10.00"),
        [
            ExpenseSplitRequest(member_id=MEMBER_A, assigned_amount=Decimal("6.25")),
            ExpenseSplitRequest(member_id=MEMBER_B, assigned_amount=Decimal("0.00")),
        ],
        PAYER,
        True,
    )

    assert splits == [(MEMBER_A, Decimal("6.25"))]
    assert refund == Decimal("6.25")
