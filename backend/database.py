from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool
from pydantic_settings import BaseSettings
from typing import Generator


class Settings(BaseSettings):
    # Security
    SECRET_KEY: str = "fallback-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Database
    DATABASE_URL: str = "sqlite:///./sayel.db"

    # Google Sheets
    GOOGLE_SHEET_ID: str = ""
    GOOGLE_SERVICE_ACCOUNT_JSON: str = "{}"

    # Admin seed
    SUPER_ADMIN_EMAIL: str = "admin@example.com"
    SUPER_ADMIN_PASSWORD: str = "Admin@123456"

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Keep-alive
    KEEP_ALIVE_ENABLED: bool = False
    KEEP_ALIVE_URL: str = "http://localhost:8000/health"
    KEEP_ALIVE_INTERVAL: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


settings = Settings()


class Base(DeclarativeBase):
    pass


def _build_engine():
    is_sqlite = "sqlite" in settings.DATABASE_URL

    if is_sqlite:
        return create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            echo=False,
        )

    return create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        echo=False,
    )


engine = _build_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
