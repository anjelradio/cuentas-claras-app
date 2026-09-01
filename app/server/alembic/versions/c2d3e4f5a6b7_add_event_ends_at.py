"""Add event end timestamp.

Revision ID: c2d3e4f5a6b7
Revises: b1f2c3d4e5f6
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "c2d3e4f5a6b7"
down_revision: str | Sequence[str] | None = "b1f2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("event", sa.Column("ends_at", sa.DateTime(), nullable=True))
    op.execute("UPDATE event SET ends_at = starts_at WHERE ends_at IS NULL")
    op.alter_column("event", "ends_at", existing_type=sa.DateTime(), nullable=False)


def downgrade() -> None:
    op.drop_column("event", "ends_at")
