import os
from typing import Any, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "ARGO Ocean Chatbot API"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True

    # Security Settings
    JWT_SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes for access tokens
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days for refresh tokens
    OPENAI_API_KEY: Optional[str] = None

    # Database Settings
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str
    DATABASE_URL: Optional[str] = None

    DATABASE_URI_ASYNC: Optional[str] = None
    DATABASE_URI_SYNC: Optional[str] = None

    @field_validator("DATABASE_URI_ASYNC", mode="before")
    @classmethod
    def assemble_async_db_connection(cls, v: Optional[str], info: Any) -> Any:
        if isinstance(v, str) and v:
            return v
        data = info.data
        db_url = data.get("DATABASE_URL")
        if db_url:
            return db_url
        user = data.get("POSTGRES_USER")
        password = data.get("POSTGRES_PASSWORD")
        host = data.get("POSTGRES_HOST")
        port = data.get("POSTGRES_PORT")
        db = data.get("POSTGRES_DB")
        return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"

    @field_validator("DATABASE_URI_SYNC", mode="before")
    @classmethod
    def assemble_sync_db_connection(cls, v: Optional[str], info: Any) -> Any:
        if isinstance(v, str) and v:
            return v
        data = info.data
        db_url = data.get("DATABASE_URL")
        if db_url:
            if db_url.startswith("postgresql+asyncpg://"):
                return db_url.replace("postgresql+asyncpg://", "postgresql://", 1)
            return db_url
        user = data.get("POSTGRES_USER")
        password = data.get("POSTGRES_PASSWORD")
        host = data.get("POSTGRES_HOST")
        port = data.get("POSTGRES_PORT")
        db = data.get("POSTGRES_DB")
        return f"postgresql://{user}:{password}@{host}:{port}/{db}"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
