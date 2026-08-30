"""Registro canónico de modelos SQLModel para que Alembic cargue su metadata."""

from sqlmodel import SQLModel

# Los modelos persistentes de módulos futuros se importan aquí antes de migrar.
__all__ = ["SQLModel"]
