"""
SmartERP Backend - Application Configuration
Unified Enterprise Platform Configuration
"""
import secrets
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartERP"
    APP_NAME: str = "SmartERP"
    VERSION: str = "1.0.0"
    APP_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Security / JWT
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(48))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # SQLite is the supported database for this project.
    DATABASE_URL: str = "sqlite:///./smarterp.db"
    ADMIN_EMAIL: str | None = None
    ADMIN_USERNAME: str = "admin"
    ADMIN_FULL_NAME: str = "ERP Administrator"
    ADMIN_PASSWORD: str | None = None

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("DATABASE_URL")
    @classmethod
    def require_sqlite(cls, value: str) -> str:
        if not value.startswith("sqlite:"):
            raise ValueError("Only SQLite DATABASE_URL values are supported")
        return value

    # Module Flags
    HR_MODULE_ENABLED: bool = True
    SALES_MODULE_ENABLED: bool = True
    INVENTORY_MODULE_ENABLED: bool = True

    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "extra": "ignore",
    }


settings = Settings()
