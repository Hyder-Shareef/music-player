import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Chong Music API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    API_PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # CORS
    CORS_ORIGIN: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:8000"
    
    # Database
    DATABASE_TYPE: str = "sqlite"  # "sqlite" or "mongodb"
    DATABASE_PATH: str = "data/chong.db"
    MONGODB_URI: str = ""
    MONGODB_DB_NAME: str = "chong_music"
    
    # Auth & Sessions
    SESSION_SECRET: str = "chong-music-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    
    # YouTube Music Client Configuration
    YTMUSIC_AUTH_PATH: str = "data/browser.json"
    YTMUSIC_LANGUAGE: str = "en"
    YTMUSIC_LOCATION: str = "US"
    
    # Cache TTL in seconds
    CACHE_METADATA_TTL: int = 3600  # 1 hour
    CACHE_STREAM_TTL: int = 18000   # 5 hours

settings = Settings()

# Ensure data directory exists
data_dir = Path("data")
data_dir.mkdir(parents=True, exist_ok=True)
