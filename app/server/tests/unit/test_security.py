"""Pruebas del verificador interno JWT/JWKS sin rutas protegidas públicas."""

from collections.abc import Callable
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from jwt import PyJWK
from jwt.exceptions import PyJWKClientError

from app.core.config import Settings
from app.core.errors import AuthenticationError
from app.core.security import JwksVerifier, extract_bearer_token


class FakeJwksClient:
    """Sustituye al cliente de red y permite observar la actualización de claves."""

    def __init__(self, signing_key: PyJWK | None = None, error: Exception | None = None) -> None:
        self.signing_key = signing_key
        self.error = error
        self.calls = 0

    def get_signing_key_from_jwt(self, token: str) -> PyJWK:
        self.calls += 1
        if self.error is not None:
            raise self.error
        assert self.signing_key is not None
        return self.signing_key


@pytest.fixture
def jwt_material() -> tuple[Ed25519PrivateKey, PyJWK]:
    """Genera una clave Ed25519 efímera equivalente a una entrada JWKS pública."""
    private_key = Ed25519PrivateKey.generate()
    public_bytes = private_key.public_key().public_bytes_raw()
    jwk = PyJWK.from_dict(
        {
            "kty": "OKP",
            "crv": "Ed25519",
            "x": jwt.utils.base64url_encode(public_bytes).decode(),
            "kid": "test-key",
            "alg": "EdDSA",
            "use": "sig",
        }
    )
    return private_key, jwk


@pytest.fixture
def security_settings() -> Settings:
    """Declara emisor de prueba y audiencia opcional, como permite la specification."""
    return Settings(
        app_env="test",
        app_name="cuentas-claras-server",
        database_url="postgresql+psycopg://test:test@localhost/test",
        cors_origins="http://allowed.example",
        auth_jwks_url="https://jwks.example.test/keys",
        auth_jwt_issuer="https://auth.example.test",
        auth_jwt_audience=None,
    )


def build_token(
    private_key: Ed25519PrivateKey,
    *,
    issuer: str = "https://auth.example.test",
    expires_at: datetime | None = None,
    subject: str | None = "user-123",
    audience: str | None = None,
) -> str:
    """Emite un JWT de prueba sin depender de Better Auth ni de claves reales."""
    payload: dict[str, object] = {
        "iss": issuer,
        "exp": expires_at or datetime.now(UTC) + timedelta(minutes=5),
    }
    if subject is not None:
        payload["sub"] = subject
    if audience is not None:
        payload["aud"] = audience
    return jwt.encode(payload, private_key, algorithm="EdDSA", headers={"kid": "test-key"})


def make_verifier(settings: Settings, factory: Callable[[str], FakeJwksClient]) -> JwksVerifier:
    """Crea el verificador con un cliente JWKS controlado por la prueba."""
    return JwksVerifier(settings, client_factory=factory)


def test_valid_jwt_builds_identity_from_validated_sub(
    jwt_material: tuple[Ed25519PrivateKey, PyJWK], security_settings: Settings
) -> None:
    """Solo el claim firmado sub se convierte en la identidad disponible."""
    private_key, jwk = jwt_material
    verifier = make_verifier(security_settings, lambda _: FakeJwksClient(jwk))

    identity = verifier.verify(build_token(private_key))

    assert identity.user_id == "user-123"
    assert identity.issuer == "https://auth.example.test"


@pytest.mark.parametrize(
    "token_factory",
    [
        lambda key: "not-a-jwt",
        lambda key: build_token(key, expires_at=datetime.now(UTC) - timedelta(minutes=1)),
        lambda key: build_token(key, issuer="https://untrusted.example"),
        lambda key: build_token(key, subject=None),
    ],
)
def test_invalid_jwts_are_rejected_safely(
    jwt_material: tuple[Ed25519PrivateKey, PyJWK],
    security_settings: Settings,
    token_factory: Callable[[Ed25519PrivateKey], str],
) -> None:
    """Formato, vencimiento, emisor y ausencia de sub no crean contexto alguno."""
    private_key, jwk = jwt_material
    verifier = make_verifier(security_settings, lambda _: FakeJwksClient(jwk))

    with pytest.raises(AuthenticationError):
        verifier.verify(token_factory(private_key))


def test_tampered_jwt_is_rejected(
    jwt_material: tuple[Ed25519PrivateKey, PyJWK], security_settings: Settings
) -> None:
    """Modificar la firma invalida por completo una credencial aparentemente válida."""
    private_key, jwk = jwt_material
    verifier = make_verifier(security_settings, lambda _: FakeJwksClient(jwk))
    valid_token = build_token(private_key)
    header, payload, signature = valid_token.split(".")
    tampered_signature = f"{'a' if signature[0] != 'a' else 'b'}{signature[1:]}"
    tampered_token = f"{header}.{payload}.{tampered_signature}"

    with pytest.raises(AuthenticationError):
        verifier.verify(tampered_token)


def test_jwks_unavailability_is_rejected_without_revealing_network_details(
    security_settings: Settings,
) -> None:
    """La falta temporal de claves públicas no permite aceptar un token."""
    verifier = make_verifier(
        security_settings,
        lambda _: FakeJwksClient(error=PyJWKClientError("network unavailable")),
    )

    with pytest.raises(AuthenticationError):
        verifier.verify("eyJhbGciOiJFZERTQSIsImtpZCI6InRlc3Qta2V5In0.payload.signature")


def test_unknown_kid_refreshes_jwks_once_before_accepting_rotated_key(
    jwt_material: tuple[Ed25519PrivateKey, PyJWK], security_settings: Settings
) -> None:
    """Una rotación de clave actualiza el cliente una vez y reutiliza el resultado."""
    private_key, jwk = jwt_material
    initial_client = FakeJwksClient(error=PyJWKClientError("kid not found"))
    refreshed_client = FakeJwksClient(jwk)
    clients = [initial_client, refreshed_client]

    verifier = make_verifier(security_settings, lambda _: clients.pop(0))
    identity = verifier.verify(build_token(private_key))

    assert identity.user_id == "user-123"
    assert initial_client.calls == 1
    assert refreshed_client.calls == 1


def test_missing_bearer_header_is_rejected() -> None:
    """La dependencia no acepta una solicitud protegida sin Authorization."""
    with pytest.raises(AuthenticationError):
        extract_bearer_token(None)


def test_configured_audience_mismatch_is_rejected(
    jwt_material: tuple[Ed25519PrivateKey, PyJWK], security_settings: Settings
) -> None:
    """Cuando el entorno exige audiencia, un JWT destinado a otro servicio falla."""
    private_key, jwk = jwt_material
    configured_settings = security_settings.model_copy(update={"auth_jwt_audience": "backend-api"})
    verifier = make_verifier(configured_settings, lambda _: FakeJwksClient(jwk))

    with pytest.raises(AuthenticationError):
        verifier.verify(build_token(private_key, audience="other-api"))
