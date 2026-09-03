"""Configuración tipada y segura de la aplicación por entorno."""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centraliza configuración no sensible y evita orígenes CORS inseguros."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    app_name: str = "cuentas-claras-server"
    database_url: str = "postgresql+psycopg://user:password@localhost/database"
    cors_origins: list[str] | str = ["http://localhost:3000"]
    auth_jwks_url: str = "https://auth.example.test/api/auth/jwks"
    auth_jwt_issuer: str = "http://localhost:3000"
    auth_jwt_audience: str | None = None
    invitation_expire_days: int = 10
    cloudinary_cloud_name: str | None = None
    cloudinary_api_key: str | None = None
    cloudinary_api_secret: str | None = None
    cloudinary_qr_folder: str = "cuentas-claras/qr"
    cloudinary_receipts_folder: str = "cuentas-claras/receipts"
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.8-flash"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: list[str] | str) -> list[str]:
        """Acepta lista o CSV, pero nunca habilita el comodín global."""
        origins = value if isinstance(value, list) else [item.strip() for item in value.split(",")]
        normalized = [origin for origin in origins if origin]
        if not normalized or "*" in normalized:
            raise ValueError("CORS_ORIGINS debe contener orígenes explícitos y no usar '*'.")
        return normalized

    @field_validator("auth_jwt_audience", mode="before")
    @classmethod
    def normalize_optional_audience(cls, value: str | None) -> str | None:
        """Convierte una variable vacía en audiencia no exigida para pruebas."""
        return value.strip() or None if isinstance(value, str) else value


@lru_cache
def get_settings() -> Settings:
    """Reutiliza una única configuración durante la vida del proceso."""
    return Settings()
