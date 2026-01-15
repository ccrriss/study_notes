from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env')

    APP_NAME: str = "Study Notes API"
    DATABASE_URL : str = "sqlite+aiosqlite:///./.notes.db"
    BACKEND_CORS_ORIGINS : List[str] = ["http://localhost:3000"]

    #JWT
    JWT_SECRET_KEY: str = "CHANGE_ME_TO_A_RANDOM_SECRET" # chagne to environment variable
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60*24 # 1 day

settings = Settings()