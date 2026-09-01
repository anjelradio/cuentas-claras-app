"""Punto de entrada de FastAPI y composición de infraestructura transversal."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.cors import CORSMiddleware

import app.db.models  # Preload SQLModel registry
from app.api.health import router as health_router
from app.core.config import Settings, get_settings
from app.core.errors import ApplicationError, InfrastructureError
from app.core.exception_handlers import (
    handle_application_error,
    handle_http_exception,
    handle_request_validation_error,
    handle_unexpected_error,
)
from app.db.core import engine


@asynccontextmanager
async def cleanup_qr_assets(_: FastAPI):
    """Reintenta eliminaciones externas pendientes sin impedir el arranque."""
    from sqlmodel import Session

    from app.modules.events.integrations.cloudinary_storage import CloudinaryStorage
    from app.modules.events.repositories.qr_asset_cleanup_repository import QrAssetCleanupRepository
    from app.modules.events.services.qr_cleanup_service import QrCleanupService

    try:
        with Session(engine) as session:
            storage = CloudinaryStorage(get_settings())
            QrCleanupService(QrAssetCleanupRepository(session), storage).process_pending()
    except (InfrastructureError, SQLAlchemyError):
        # Cloudinary no es obligatorio para arrancar la API; el QR sí dará su
        # error uniforme hasta que se configuren sus credenciales.
        pass
    yield


def create_app(settings: Settings | None = None) -> FastAPI:
    """Compone una aplicación mínima con CORS y errores uniformes registrados una vez."""
    app_settings = settings or get_settings()
    application = FastAPI(title=app_settings.app_name, version="0.1.0", lifespan=cleanup_qr_assets)
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

    from app.modules.activity.routers.activity import router as activity_router
    from app.modules.events.routers.event_router import router as event_router
    from app.modules.expenses.routers.expense_router import router as expense_router

    application.include_router(event_router)
    application.include_router(activity_router)
    application.include_router(expense_router)

    return application


app = create_app()
