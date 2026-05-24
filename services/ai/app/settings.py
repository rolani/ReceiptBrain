"""Environment-validated settings for the AI service."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Internal auth — only the worker may call this service.
    ai_service_token: str = Field(..., alias="AI_SERVICE_TOKEN")

    # OpenAI
    openai_api_key: str = Field(..., alias="OPENAI_API_KEY")
    openai_model_extract: str = Field("gpt-4o", alias="OPENAI_MODEL_EXTRACT")
    openai_model_recommend: str = Field("gpt-4o-mini", alias="OPENAI_MODEL_RECOMMEND")

    # Prompt versions (used in ExtractionAttempt rows and responses).
    prompt_version_extract: str = Field("extract-v1", alias="PROMPT_VERSION_EXTRACT")
    prompt_version_recommend: str = Field("recommend-v1", alias="PROMPT_VERSION_RECOMMEND")

    log_level: str = Field("info", alias="LOG_LEVEL")
    sentry_dsn: str | None = Field(None, alias="SENTRY_DSN")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached accessor so we validate env once per process."""
    return Settings()  # type: ignore[call-arg]
