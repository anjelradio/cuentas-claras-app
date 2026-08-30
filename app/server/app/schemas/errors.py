"""Contrato público y estable para todas las respuestas de error."""

from typing import Any

from pydantic import BaseModel


class ErrorRead(BaseModel):
    """Expone solo código, mensaje seguro y detalles previamente permitidos."""

    code: str
    message: str
    details: dict[str, Any] | None = None
