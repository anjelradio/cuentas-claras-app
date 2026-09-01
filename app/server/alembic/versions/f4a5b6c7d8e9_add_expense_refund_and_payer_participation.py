"""add expense refund and payer participation

Revision ID: f4a5b6c7d8e9
Revises: d3e4f5a6b7c8
Create Date: 2026-09-01 12:45:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f4a5b6c7d8e9"
down_revision: str | Sequence[str] | None = "d3e4f5a6b7c8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("expense", sa.Column("refund_amount", sa.Numeric(10, 2), nullable=True))
    op.add_column("expense", sa.Column("payer_participated", sa.Boolean(), nullable=True))

    # El contrato anterior podía crear cuotas del pagador y cuotas de cero. Se
    # conservan como evidencia histórica, pero dejan de afectar el balance activo.
    op.execute(
        """
        UPDATE expense
        SET payer_participated = EXISTS (
            SELECT 1 FROM expensesplit
            WHERE expensesplit.expense_id = expense.id
              AND expensesplit.member_id = expense.paid_by_member_id
              AND expensesplit.deleted_at IS NULL
        )
        """
    )
    op.execute(
        """
        UPDATE expensesplit
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        FROM expense
        WHERE expensesplit.expense_id = expense.id
          AND expensesplit.deleted_at IS NULL
          AND (expensesplit.member_id = expense.paid_by_member_id OR expensesplit.assigned_amount = 0)
        """
    )
    op.execute(
        """
        UPDATE expense
        SET refund_amount = COALESCE((
            SELECT SUM(expensesplit.assigned_amount)
            FROM expensesplit
            WHERE expensesplit.expense_id = expense.id
              AND expensesplit.deleted_at IS NULL
        ), 0)
        """
    )
    op.alter_column("expense", "refund_amount", nullable=False, server_default="0")
    op.alter_column("expense", "payer_participated", nullable=False, server_default=sa.true())
    op.create_check_constraint(
        "chk_expense_refund_amount_range",
        "expense",
        "refund_amount >= 0 AND refund_amount <= amount",
    )


def downgrade() -> None:
    op.drop_constraint("chk_expense_refund_amount_range", "expense", type_="check")
    op.drop_column("expense", "payer_participated")
    op.drop_column("expense", "refund_amount")
