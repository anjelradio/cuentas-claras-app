"""Modelo persistente base con auditoría y eliminación lógica."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class BaseModel(SQLModel):
    """Base abstracta para futuros modelos persistentes de cada módulo."""

    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), nullable=False)
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        nullable=False,
        sa_column_kwargs={"onupdate": lambda _=None: datetime.now(UTC)},
    )
    deleted_at: datetime | None = Field(default=None, nullable=True)
