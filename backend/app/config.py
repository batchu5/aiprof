from typing import List, Union
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Study Companion API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development")

    # Supabase Credentials
    SUPABASE_URL: str = Field(default="https://your-project.supabase.co")
    SUPABASE_KEY: str = Field(default="your-supabase-anon-key")
    SUPABASE_SERVICE_KEY: str = Field(default="your-supabase-service-role-key")

    # Gemini AI
    GEMINI_API_KEY: str = Field(default="your-gemini-api-key")

    # Auth & Security
    JWT_SECRET: str = Field(default="your-jwt-secret-key")

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = Field(default="http://localhost:5173")

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return self.CORS_ORIGINS

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
