"""Contrato público de la comprobación de disponibilidad."""

from typing import Literal

from pydantic import BaseModel


class HealthRead(BaseModel):
    """Respuesta estable del healthcheck sin información de infraestructura."""

    status: Literal["ok"]
    service: str
