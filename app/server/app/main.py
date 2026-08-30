"""Punto de entrada de FastAPI y composición de infraestructura transversal."""

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.core.config import Settings, get_settings
from app.core.errors import ApplicationError
from app.core.exception_handlers import (
    handle_application_error,
    handle_http_exception,
    handle_request_validation_error,
    handle_unexpected_error,
)


def create_app(settings: Settings | None = None) -> FastAPI:
    """Compone una aplicación mínima con CORS y errores uniformes registrados una vez."""
    app_settings = settings or get_settings()
    application = FastAPI(title=app_settings.app_name, version="0.1.0")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )
    application.add_exception_handler(ApplicationError, handle_application_error)
    application.add_exception_handler(RequestValidationError, handle_request_validation_error)
    application.add_exception_handler(StarletteHTTPException, handle_http_exception)
    application.add_exception_handler(Exception, handle_unexpected_error)
    application.include_router(health_router)
    return application


app = create_app()
