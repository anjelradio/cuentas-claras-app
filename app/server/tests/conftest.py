"""Fixtures compartidos, aislados de variables reales y de red."""

from collections.abc import AsyncGenerator

import httpx
import pytest
from fastapi import FastAPI

from app.core.config import Settings
from app.main import create_app


@pytest.fixture
def anyio_backend() -> str:
    """Ejecuta contratos ASGI con asyncio, sin depender de un backend adicional."""
    return "asyncio"


@pytest.fixture
def settings() -> Settings:
    """Devuelve configuración determinista para contratos y seguridad."""
    return Settings(
        app_env="test",
        app_name="cuentas-claras-server",
        database_url="postgresql+psycopg://test:test@localhost/test",
        cors_origins="http://allowed.example",
        auth_jwks_url="https://jwks.example.test/keys",
        auth_jwt_issuer="https://auth.example.test",
        auth_jwt_audience=None,
    )


@pytest.fixture
def app(settings: Settings) -> FastAPI:
    """Construye una aplicación aislada para cada prueba de contrato."""
    return create_app(settings)


@pytest.fixture
async def client(app: FastAPI) -> AsyncGenerator[httpx.AsyncClient]:
    """Expone la aplicación sin llamar servicios externos."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as test_client:
        yield test_client
