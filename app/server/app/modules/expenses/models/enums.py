from enum import StrEnum


class ExpenseCategory(StrEnum):
    FOOD = "food"
    LODGING = "lodging"
    TRANSPORT = "transport"
    SHOPPING = "shopping"
    ENTERTAINMENT = "entertainment"
    OTHER = "other"


class ExpenseSplitType(StrEnum):
    EQUAL = "equal"
    EXACT = "exact"
