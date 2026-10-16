from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str

    # Orígenes CORS permitidos, separados por coma. En producción el
    # frontend llama a /api relativo (mismo dominio vía Traefik), así que
    # esto solo importa para desarrollo local con puertos distintos.
    cors_origins: str = "http://localhost:3004"

    secret_key: str
    environment: str = "development"

    # Secret para el endpoint de alta del único admin (ver routers/auth.py).
    bootstrap_secret: str = ""

    # Carpeta donde se guardan las fotos de jugador subidas.
    uploads_dir: str = "uploads"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
