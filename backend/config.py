import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "change-this-before-deployment"
    DATABASE_URL: str = "sqlite:///./memoryos.db"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    RESEND_API_KEY: str = ""
    FROM_EMAIL: str = "onboarding@resend.dev"
    APP_NAME: str = "MemoryOS"
    FRONTEND_URL: str = "http://localhost:3000"
    GROQ_API_KEY: str = ""
    HF_TOKEN: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()