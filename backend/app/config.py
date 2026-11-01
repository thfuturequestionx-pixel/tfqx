from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    mongodb_uri: str
    mongodb_db: str = "tfqx"

    host_username: str = "host"
    host_password: str = Field(min_length=8)
    jwt_secret: str = Field(min_length=32)
    jwt_expire_minutes: int = 480

    cors_origins: str = "http://localhost:3000"
    upload_dir: str = "uploads"
    max_upload_mb: int = 15

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()