"""add activity_read_receipt table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f7
Create Date: 2026-09-03 17:21:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: str | Sequence[str] | None = "a1b2c3d4e5f7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "activity_read_receipt",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("user_id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("activity_id", sa.Uuid(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["activity_id"], ["activitylog.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "activity_id", name="uq_activity_read_receipt_user_activity"),
    )
    op.create_index(
        op.f("ix_activity_read_receipt_id"), "activity_read_receipt", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_activity_read_receipt_user_id"), "activity_read_receipt", ["user_id"], unique=False
    )
    op.create_index(
        op.f("ix_activity_read_receipt_activity_id"), "activity_read_receipt", ["activity_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_activity_read_receipt_activity_id"), table_name="activity_read_receipt")
    op.drop_index(op.f("ix_activity_read_receipt_user_id"), table_name="activity_read_receipt")
    op.drop_index(op.f("ix_activity_read_receipt_id"), table_name="activity_read_receipt")
    op.drop_table("activity_read_receipt")
