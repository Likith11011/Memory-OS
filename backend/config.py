import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Explicitly load .env file from the backend directory
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

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
        env_file = str(env_path)
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()