"""Handlers globales que preservan un único contrato público de errores."""

from collections.abc import Sequence
from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import status
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.errors import ApplicationError
from app.schemas.errors import ErrorRead


def public_error_response(
    *, status_code: int, code: str, message: str, details: dict[str, Any] | None = None
) -> JSONResponse:
    """Construye respuestas de error sin incluir excepciones ni valores enviados."""
    payload = ErrorRead(code=code, message=message, details=details)
    return JSONResponse(status_code=status_code, content=payload.model_dump())


async def handle_application_error(_: Request, error: Exception) -> JSONResponse:
    """Traduce errores tipados sin dejar que routers inventen formatos propios."""
    if not isinstance(error, ApplicationError):
        return await handle_unexpected_error(_, error)
    return public_error_response(
        status_code=error.status_code,
        code=error.code,
        message=error.message,
        details=error.details,
    )


def validation_details(errors: Sequence[dict[str, Any]]) -> dict[str, list[dict[str, str]]]:
    """Reduce detalles de validación a ubicación, mensaje y tipo seguros."""
    safe_errors: list[dict[str, str]] = []
    for error in errors:
        location = ".".join(str(part) for part in error.get("loc", []))
        safe_errors.append(
            {
                "location": location,
                "message": str(error.get("msg", "Valor inválido.")),
                "type": str(error.get("type", "validation_error")),
            }
        )
    return {"fields": safe_errors}


async def handle_request_validation_error(_: Request, error: Exception) -> JSONResponse:
    """Mantiene detalles de validación útiles sin incluir el input original."""
    if not isinstance(error, RequestValidationError):
        return await handle_unexpected_error(_, error)
        
    # If the validation error is because of an invalid UUID in the path, it should be 404
    for err in error.errors():
        if err.get("type") == "uuid_parsing" and "path" in err.get("loc", []):
            return public_error_response(
                status_code=404,
                code="NOT_FOUND",
                message="El recurso solicitado no existe.",
            )
            
    return public_error_response(
        status_code=422,
        code="VALIDATION_ERROR",
        message="La solicitud contiene datos inválidos.",
        details=validation_details(error.errors()),
    )


async def handle_http_exception(_: Request, error: Exception) -> JSONResponse:
    """Convierte errores HTTP de framework a códigos sin filtrar su detalle interno."""
    if not isinstance(error, StarletteHTTPException):
        return await handle_unexpected_error(_, error)
    messages = {
        400: "La solicitud no es válida.",
        401: "Se requiere una credencial válida para realizar esta operación.",
        403: "No tienes permiso para realizar esta operación.",
        404: "El recurso solicitado no existe.",
        405: "El método HTTP no está permitido para este recurso.",
    }
    return public_error_response(
        status_code=error.status_code,
        code={404: "NOT_FOUND", 405: "METHOD_NOT_ALLOWED"}.get(error.status_code, "HTTP_ERROR"),
        message=messages.get(error.status_code, "La solicitud no pudo procesarse."),
    )


async def handle_unexpected_error(_: Request, __: Exception) -> JSONResponse:
    """Evita filtrar trazas, SQL, tokens o secretos de infraestructura."""
    return public_error_response(
        status_code=500,
        code="INTERNAL_ERROR",
        message="Ocurrió un error interno.",
    )
