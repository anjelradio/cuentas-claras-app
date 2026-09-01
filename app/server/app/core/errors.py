"""Excepciones de aplicación independientes de FastAPI y del transporte HTTP."""


class ApplicationError(Exception):
    """Representa un fallo traducible por los handlers centralizados."""

    status_code = 500
    code = "INTERNAL_ERROR"
    message = "Ocurrió un error interno."
    details: dict[str, object] | None = None

    def __init__(
        self,
        message: str | None = None,
        *,
        details: dict[str, object] | None = None,
    ) -> None:
        """Permite a los casos de uso devolver mensajes públicos y seguros."""
        self.message = message or type(self).message
        self.details = details
        super().__init__(self.message)


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


ForbiddenError = AuthorizationError


class InfrastructureError(ApplicationError):
    """Uniforma fallos de infraestructura sin trasladar su detalle al cliente."""


class NotFoundError(ApplicationError):
    """Indica que el recurso solicitado no existe o fue eliminado lógicamente."""

    status_code = 404
    code = "NOT_FOUND"
    message = "El recurso no fue encontrado."


class ValidationError(ApplicationError):
    """Indica que hubo un problema de validación de negocio."""

    status_code = 400
    code = "BAD_REQUEST"
    message = "Error de validación."
