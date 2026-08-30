"""Contrato seguro para fallos de validación y de infraestructura."""

import httpx
import pytest
from fastapi import APIRouter, FastAPI

from app.core.errors import AuthenticationError
from app.main import create_app


@pytest.mark.anyio
async def test_application_errors_use_the_public_contract(
    app: FastAPI, client: httpx.AsyncClient
) -> None:
    """Errores de autenticación no revelan la causa de validación interna."""
    router = APIRouter()

    @router.get("/auth-error")
    async def raise_authentication_error() -> None:
        raise AuthenticationError()

    app.include_router(router)
    response = await client.get("/auth-error")

    assert response.status_code == 401
    assert response.json() == {
        "code": "INVALID_CREDENTIAL",
        "message": "No fue posible validar la credencial.",
        "details": None,
    }


@pytest.mark.anyio
async def test_validation_errors_never_echo_submitted_values(
    app: FastAPI, client: httpx.AsyncClient
) -> None:
    """Los detalles de validación incluyen solo ubicaciones y mensajes permitidos."""
    router = APIRouter()

    @router.get("/validation")
    async def validate_quantity(quantity: int) -> None:
        return None

    app.include_router(router)
    response = await client.get("/validation?quantity=secret-token")

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"
    assert "secret-token" not in response.text


@pytest.mark.anyio
async def test_unexpected_errors_do_not_leak_internal_details() -> None:
    """Una excepción no controlada conserva el contrato público seguro."""
    app = create_app()
    router = APIRouter()

    @router.get("/unexpected-error")
    async def raise_unexpected_error() -> None:
        raise RuntimeError("postgresql password=super-secret")

    app.include_router(router)
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/unexpected-error")

    assert response.status_code == 500
    assert response.json() == {
        "code": "INTERNAL_ERROR",
        "message": "Ocurrió un error interno.",
        "details": None,
    }
    assert "super-secret" not in response.text


@pytest.mark.anyio
async def test_not_found_uses_the_uniform_error_contract(client: httpx.AsyncClient) -> None:
    """Los recursos inexistentes no devuelven el formato default detail de FastAPI."""
    response = await client.get("/resource-that-does-not-exist")

    assert response.status_code == 404
    assert response.json() == {
        "code": "NOT_FOUND",
        "message": "El recurso solicitado no existe.",
        "details": None,
    }
