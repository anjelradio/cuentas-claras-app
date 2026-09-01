"""add expenses and splits

Revision ID: d3e4f5a6b7c8
Revises: ec6c1ab2cf09
Create Date: 2026-08-31 22:45:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d3e4f5a6b7c8"
down_revision: str | Sequence[str] | None = "ec6c1ab2cf09"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "expense",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column("created_by_member_id", sa.Uuid(), nullable=False),
        sa.Column("paid_by_member_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("category", sa.String(length=30), nullable=False),
        sa.Column("split_type", sa.String(length=20), nullable=False),
        sa.Column("expense_date", sa.DateTime(), nullable=False),
        sa.Column("receipt_url", sa.String(length=500), nullable=True),
        sa.Column("receipt_public_id", sa.String(length=200), nullable=True),
        sa.CheckConstraint("amount > 0", name="chk_expense_amount_positive"),
        sa.ForeignKeyConstraint(["created_by_member_id"], ["eventmember.id"]),
        sa.ForeignKeyConstraint(["event_id"], ["event.id"]),
        sa.ForeignKeyConstraint(["paid_by_member_id"], ["eventmember.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_expense_created_by_member_id"), "expense", ["created_by_member_id"], unique=False
    )
    op.create_index(op.f("ix_expense_event_id"), "expense", ["event_id"], unique=False)
    op.create_index(
        "ix_expense_event_id_deleted_at_date",
        "expense",
        ["event_id", "deleted_at", "expense_date"],
        unique=False,
    )
    op.create_index(op.f("ix_expense_id"), "expense", ["id"], unique=False)
    op.create_index(
        op.f("ix_expense_paid_by_member_id"), "expense", ["paid_by_member_id"], unique=False
    )

    op.create_table(
        "expensesplit",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("expense_id", sa.Uuid(), nullable=False),
        sa.Column("member_id", sa.Uuid(), nullable=False),
        sa.Column("assigned_amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.CheckConstraint("assigned_amount >= 0", name="chk_expense_split_amount_non_negative"),
        sa.ForeignKeyConstraint(["expense_id"], ["expense.id"]),
        sa.ForeignKeyConstraint(["member_id"], ["eventmember.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("expense_id", "member_id", name="uq_expense_split_member"),
    )
    op.create_index(
        op.f("ix_expensesplit_expense_id"), "expensesplit", ["expense_id"], unique=False
    )
    op.create_index(op.f("ix_expensesplit_id"), "expensesplit", ["id"], unique=False)
    op.create_index(op.f("ix_expensesplit_member_id"), "expensesplit", ["member_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_expensesplit_member_id"), table_name="expensesplit")
    op.drop_index(op.f("ix_expensesplit_id"), table_name="expensesplit")
    op.drop_index(op.f("ix_expensesplit_expense_id"), table_name="expensesplit")
    op.drop_table("expensesplit")

    op.drop_index(op.f("ix_expense_paid_by_member_id"), table_name="expense")
    op.drop_index(op.f("ix_expense_id"), table_name="expense")
    op.drop_index("ix_expense_event_id_deleted_at_date", table_name="expense")
    op.drop_index(op.f("ix_expense_event_id"), table_name="expense")
    op.drop_index(op.f("ix_expense_created_by_member_id"), table_name="expense")
    op.drop_table("expense")
