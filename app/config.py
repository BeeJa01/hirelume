from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "sqlite:///./hirelume.db"
    secret_key: str = "change-this-in-production"
    access_token_expire_minutes: int = 1440
    gemini_api_key: str | None = None
    gemini_model: str | None = None
    max_file_size_mb: int = 5
    flow2_daily_limit: int = 5
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
