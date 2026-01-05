from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DB_NAME: str = "northwind"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    DB_HOST: str = "db"
    DB_PORT: str = "5432"
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    JWT_SECRET: str = "development_secret_key_min_32_chars"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 86400
    DEBUG: bool = True
    
    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
