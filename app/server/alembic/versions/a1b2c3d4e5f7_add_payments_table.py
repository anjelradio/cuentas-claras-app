"""add payments table

Revision ID: a1b2c3d4e5f7
Revises: f4a5b6c7d8e9
Create Date: 2026-09-01 13:50:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f7"
down_revision: str | Sequence[str] | None = "f4a5b6c7d8e9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "payment",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("split_id", sa.Uuid(), nullable=False),
        sa.Column("payment_method", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("proof_image_url", sa.String(length=500), nullable=True),
        sa.Column("proof_image_public_id", sa.String(length=255), nullable=True),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["split_id"], ["expensesplit.id"], name="fk_payment_split_id"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_payment_split_id", "payment", ["split_id"], unique=False)
    op.create_index("ix_payment_status", "payment", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_payment_status", table_name="payment")
    op.drop_index("ix_payment_split_id", table_name="payment")
    op.drop_table("payment")
