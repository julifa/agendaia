from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Conexión directa a Postgres de Supabase (Connection string > Session pooler).
    # El backend usa el rol de servicio: bypassea RLS, así que toda autorización
    # que dependa del usuario se hace explícitamente en la capa de servicio.
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"

    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_jwt_secret: str = ""

    # Webhook de notificaciones (WhatsApp/Email) descrito en ARCHITECTURE.md
    notifications_webhook_url: str | None = None

    db_echo: bool = False
    cors_origins: list[str] = ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
