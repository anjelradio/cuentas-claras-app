"""Add QR external asset metadata and cleanup queue.

Revision ID: b1f2c3d4e5f6
Revises: aa1a6c61b65a
"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "b1f2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "aa1a6c61b65a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("eventmember", sa.Column("qr_image_public_id", sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.create_table(
        "qrassetcleanup",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("event_member_id", sa.Uuid(), nullable=False),
        sa.Column("public_id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("reason", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("status", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False),
        sa.Column("last_attempt_at", sa.DateTime(), nullable=True),
        sa.Column("last_error_code", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.ForeignKeyConstraint(["event_member_id"], ["eventmember.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    for column in ("id", "event_member_id", "public_id", "status"):
        op.create_index(f"ix_qrassetcleanup_{column}", "qrassetcleanup", [column], unique=False)


def downgrade() -> None:
    for column in ("status", "public_id", "event_member_id", "id"):
        op.drop_index(f"ix_qrassetcleanup_{column}", table_name="qrassetcleanup")
    op.drop_table("qrassetcleanup")
    op.drop_column("eventmember", "qr_image_public_id")
