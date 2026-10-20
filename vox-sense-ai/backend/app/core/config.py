"""VoxSense AI Backend — Configuration"""
from pydantic_settings import BaseSettings
from pathlib import Path
import os


BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False

    # CORS — comma-separated allowed origins
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # File limits
    MAX_UPLOAD_SIZE_MB: float = 25.0
    MAX_AUDIO_DURATION_SECONDS: float = 60.0
    MIN_AUDIO_DURATION_SECONDS: float = 0.5

    # Model artifact
    MODEL_ARTIFACT_PATH: str = str(BASE_DIR / "artifacts" / "model.pt")

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return int(self.MAX_UPLOAD_SIZE_MB * 1024 * 1024)


settings = Settings()
