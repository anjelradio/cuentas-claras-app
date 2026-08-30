"""Excepciones de aplicación independientes de FastAPI y del transporte HTTP."""


class ApplicationError(Exception):
    """Representa un fallo traducible por los handlers centralizados."""

    status_code = 500
    code = "INTERNAL_ERROR"
    message = "Ocurrió un error interno."
    details: dict[str, object] | None = None


class AuthenticationError(ApplicationError):
    """Indica una credencial ausente o inválida sin revelar la causa concreta."""

    status_code = 401
    code = "INVALID_CREDENTIAL"
    message = "No fue posible validar la credencial."


class AuthorizationError(ApplicationError):
    """Reserva el contrato de autorización para capacidades futuras."""

    status_code = 403
    code = "FORBIDDEN"
    message = "No tienes permiso para realizar esta operación."


class InfrastructureError(ApplicationError):
    """Uniforma fallos de infraestructura sin trasladar su detalle al cliente."""
