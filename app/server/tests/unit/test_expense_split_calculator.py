from decimal import Decimal
from uuid import UUID, uuid4

import pytest

from app.core.errors import ValidationError
from app.modules.expenses.services.expense_service import ExpenseService


def test_calculate_equal_splits_100_divided_by_3():
    m1 = UUID("11111111-1111-1111-1111-111111111111")
    m2 = UUID("22222222-2222-2222-2222-222222222222")
    m3 = UUID("33333333-3333-3333-3333-333333333333")

    splits = ExpenseService.calculate_equal_splits(
        amount=Decimal("100.00"),
        member_ids=[m3, m1, m2],  # unsorted input to check stable sort
    )

    assert len(splits) == 3
    # m1 should get 33.34, m2: 33.33, m3: 33.33 (sorted order)
    assert splits[0] == (m1, Decimal("33.34"))
    assert splits[1] == (m2, Decimal("33.33"))
    assert splits[2] == (m3, Decimal("33.33"))

    total_sum = sum(s[1] for s in splits)
    assert total_sum == Decimal("100.00")


def test_calculate_equal_splits_10_divided_by_6():
    members = [uuid4() for _ in range(6)]
    sorted_members = sorted(members)

    splits = ExpenseService.calculate_equal_splits(
        amount=Decimal("10.00"),
        member_ids=members,
    )

    assert len(splits) == 6
    # 1000 cents // 6 = 166 cents (1.66), remainder = 4 cents
    # First 4 get 1.67, last 2 get 1.66
    for i in range(4):
        assert splits[i] == (sorted_members[i], Decimal("1.67"))
    for i in range(4, 6):
        assert splits[i] == (sorted_members[i], Decimal("1.66"))

    total_sum = sum(s[1] for s in splits)
    assert total_sum == Decimal("10.00")


def test_validate_exact_splits_success():
    m1 = uuid4()
    m2 = uuid4()
    splits_input = [(m1, Decimal("45.50")), (m2, Decimal("54.50"))]

    splits = ExpenseService.validate_exact_splits(
        amount=Decimal("100.00"),
        splits_input=splits_input,
    )
    assert len(splits) == 2
    assert sum(s[1] for s in splits) == Decimal("100.00")


def test_validate_exact_splits_mismatch_fails():
    m1 = uuid4()
    m2 = uuid4()
    splits_input = [(m1, Decimal("45.50")), (m2, Decimal("54.49"))]  # total 99.99

    with pytest.raises(ValidationError, match="no coincide con el total"):
        ExpenseService.validate_exact_splits(
            amount=Decimal("100.00"),
            splits_input=splits_input,
        )


def test_validate_splits_rejects_negative_or_zero():
    m1 = uuid4()
    with pytest.raises(ValidationError, match="El monto del gasto debe ser mayor a 0"):
        ExpenseService.calculate_equal_splits(amount=Decimal("0.00"), member_ids=[m1])

    with pytest.raises(ValidationError, match="Debe incluir al menos un participante"):
        ExpenseService.calculate_equal_splits(amount=Decimal("50.00"), member_ids=[])
