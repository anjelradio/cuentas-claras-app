"""Ruta pública de disponibilidad para la fundación del servidor."""

from fastapi import APIRouter

from app.schemas.health import HealthRead

router = APIRouter(prefix="/api/v1", tags=["health"])


@router.get("/health", response_model=HealthRead, summary="Comprobar disponibilidad")
async def read_health() -> HealthRead:
    """Responde sin autenticación, red externa ni acceso a persistencia."""
    return HealthRead(status="ok", service="cuentas-claras-server")
