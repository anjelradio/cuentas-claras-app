"""Contrato de auditoría del modelo SQLModel compartido."""

from datetime import UTC, datetime

from sqlmodel import Field

from app.db.base import BaseModel


class ExampleModel(BaseModel, table=True):
    """Modelo de prueba que representa una entidad persistente futura."""

    name: str = Field(default="example")


def test_base_model_has_audit_fields_and_updated_at_onupdate() -> None:
    """La columna de modificación registra automáticamente la última escritura."""
    table = ExampleModel.__table__
    updated_at = table.columns.updated_at

    assert table.columns.id.primary_key
    assert table.columns.deleted_at.nullable
    assert updated_at.onupdate is not None
    updated_value = updated_at.onupdate.arg(None)
    assert isinstance(updated_value, datetime)
    assert updated_value.tzinfo == UTC
