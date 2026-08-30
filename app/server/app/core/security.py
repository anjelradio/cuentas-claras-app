"""Verificación reutilizable de JWT firmados por Better Auth mediante JWKS."""

from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Protocol

import jwt
from fastapi import Header
from jwt import PyJWK, PyJWKClient
from jwt.exceptions import InvalidTokenError, PyJWKClientError
from jwt.types import Options

from app.core.config import Settings
from app.core.errors import AuthenticationError


class SigningKeyClient(Protocol):
    """Contrato mínimo del cliente JWKS que facilita pruebas sin red."""

    def get_signing_key_from_jwt(self, token: str) -> PyJWK: ...


@dataclass(frozen=True, slots=True)
class IdentityContext:
    """Identidad transitoria derivada exclusivamente de claims ya validados."""

    user_id: str
    issuer: str
    expires_at: datetime


def extract_bearer_token(authorization: str | None) -> str:
    """Extrae un bearer token sin aceptar formatos alternativos de credenciales."""
    if authorization is None:
        raise AuthenticationError()

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise AuthenticationError()
    return token.strip()


def get_bearer_token(authorization: str | None = Header(default=None)) -> str:
    """Dependencia futura de FastAPI para routers protegidos aún inexistentes."""
    return extract_bearer_token(authorization)


class JwksVerifier:
    """Valida tokens EdDSA y renueva una vez la caché cuando cambia el `kid`."""

    def __init__(
        self,
        settings: Settings,
        *,
        client_factory: Callable[[str], SigningKeyClient] = lambda url: PyJWKClient(
            url, cache_keys=True
        ),
    ) -> None:
        self._settings = settings
        self._client_factory = client_factory
        self._client = client_factory(settings.auth_jwks_url)

    def verify(self, token: str) -> IdentityContext:
        """Devuelve identidad solo tras verificar firma, claims y clave pública."""
        try:
            header = jwt.get_unverified_header(token)
            if header.get("alg") != "EdDSA" or not header.get("kid"):
                raise AuthenticationError()

            signing_key = self._get_signing_key_with_single_refresh(token)
            claims = self._decode_claims(token, signing_key.key)
            subject = claims.get("sub")
            expires_at = claims.get("exp")
            issuer = claims.get("iss")

            if not isinstance(subject, str) or not subject:
                raise AuthenticationError()
            if not isinstance(expires_at, (int, float)) or not isinstance(issuer, str):
                raise AuthenticationError()

            return IdentityContext(
                user_id=subject,
                issuer=issuer,
                expires_at=datetime.fromtimestamp(expires_at, tz=UTC),
            )
        except (AuthenticationError, InvalidTokenError, PyJWKClientError, ValueError, TypeError):
            raise AuthenticationError() from None

    def _get_signing_key_with_single_refresh(self, token: str) -> PyJWK:
        """Consulta la caché y recrea el cliente una única vez ante clave desconocida."""
        try:
            return self._client.get_signing_key_from_jwt(token)
        except PyJWKClientError:
            self._client = self._client_factory(self._settings.auth_jwks_url)
            return self._client.get_signing_key_from_jwt(token)

    def _decode_claims(self, token: str, signing_key: Any) -> dict[str, Any]:
        """Restringe algoritmo y aplica audiencia solo cuando el entorno la define."""
        options: Options = {"verify_aud": self._settings.auth_jwt_audience is not None}
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["EdDSA"],
            issuer=self._settings.auth_jwt_issuer,
            audience=self._settings.auth_jwt_audience,
            options=options,
        )
        return dict(claims)
