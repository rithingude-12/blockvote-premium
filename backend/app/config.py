import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./voting.db"

    # Blockchain
    GANACHE_URL: str = "http://localhost:8545"
    GANACHE_NETWORK_ID: int = 1337

    # JWT Authentication
    JWT_SECRET: str = "super-secret-key-that-needs-to-be-changed"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Biometric Settings
    BIOMETRIC_ENCRYPTION_KEY: str = "exactly-32-characters-key-123456"
    BIOMETRIC_SALT_PEPPER: str = "your-pepper-min-16-chars"
    FACE_THRESHOLD: float = 70.0 # Face++ returns confidence 0-100, usually > 70 is good
    FINGERPRINT_THRESHOLD: float = 0.75

    # Face++ API settings
    FACEPLUSPLUS_API_KEY: str = ""
    FACEPLUSPLUS_API_SECRET: str = ""

    # Security Policies
    MAX_AUTH_ATTEMPTS: int = 3
    SESSION_TIMEOUT_SECONDS: int = 120
    LOCKOUT_DURATION_MINUTES: int = 30

    # CORS settings
    CORS_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"

settings = Settings()
