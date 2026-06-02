from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-based configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Paths to trained artifacts (Colab exports)
    model_dir: Path = Field(default=Path("../model"))
    label_mapping_path: Path = Field(default=Path("../model/label_mapping.json"))

    max_upload_size_mb: int = 25
    max_files_per_request: int = 100
    text_preview_length: int = 280
    max_text_chars: int = 12000

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    def resolve_path(self, path: Path) -> Path:
        """Resolve relative paths from backend/ working directory."""
        if path.is_absolute():
            return path
        backend_root = Path(__file__).resolve().parents[2]
        return (backend_root / path).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
