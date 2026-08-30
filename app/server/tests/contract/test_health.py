"""Contratos observables del healthcheck y de la frontera CORS."""

from time import perf_counter

import httpx
import pytest


@pytest.mark.anyio
async def test_healthcheck_returns_the_public_contract(client: httpx.AsyncClient) -> None:
    """El endpoint público no revela configuración ni depende de la base de datos."""
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "cuentas-claras-server"}


@pytest.mark.anyio
async def test_healthcheck_completes_locally_without_external_dependencies(
    client: httpx.AsyncClient,
) -> None:
    """La ruta de diagnóstico local conserva el objetivo de latencia de la fundación."""
    started_at = perf_counter()
    response = await client.get("/api/v1/health")
    elapsed_seconds = perf_counter() - started_at

    assert response.status_code == 200
    assert elapsed_seconds < 0.2


@pytest.mark.anyio
async def test_cors_allows_only_configured_origins(client: httpx.AsyncClient) -> None:
    """El middleware responde preflight solo para el origen autorizado."""
    allowed = await client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://allowed.example",
            "Access-Control-Request-Method": "GET",
        },
    )
    blocked = await client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://blocked.example",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert allowed.headers["access-control-allow-origin"] == "http://allowed.example"
    assert "access-control-allow-origin" not in blocked.headers
