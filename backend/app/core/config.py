from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field("Eroz API", alias="APP_NAME")
    database_url: str = Field(
        "postgresql://eroz:erozpassword@localhost:5432/eroz",
        alias="DATABASE_URL",
    )
    jwt_secret: str = Field("secret_dev_key_123", alias="JWT_SECRET")
    jwt_algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    access_token_expires_days: int = Field(30, alias="ACCESS_TOKEN_EXPIRES_DAYS")
    groq_api_key: str | None = Field(None, alias="GROQ_API_KEY")
    upload_dir: str = Field("uploads", alias="UPLOAD_DIR")
    max_upload_mb: int = Field(5, alias="MAX_UPLOAD_MB")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", populate_by_name=True)


settings = Settings()
