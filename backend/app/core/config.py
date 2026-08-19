from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

_BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


class Settings(BaseSettings):
    PROJECT_NAME: str = "ProctorAI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "supersecret_proctorai_jwt_key_change_in_production_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Groq Cloud (question generation)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-20b"

    # Database
    DATABASE_URL: str = "sqlite:///./proctorai.db"

    # Evidence and uploads storage directory
    UPLOAD_DIR: str = os.path.join(_BACKEND_ROOT, "uploads")
    EVIDENCE_DIR: str = os.path.join(_BACKEND_ROOT, "uploads", "evidence")

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=os.path.join(_BACKEND_ROOT, ".env"),
        extra="ignore",
    )

settings = Settings()

# Ensure uploads and evidence directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.EVIDENCE_DIR, exist_ok=True)
