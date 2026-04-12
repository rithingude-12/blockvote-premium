from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# If using PostgreSQL, format is typically: postgresql://user:pass@localhost/dbname
# If using SQLite for dev, it's sqlite:///./voting.db

from sqlalchemy.pool import NullPool

# Optimized engine for Render/Postgres Free Tier resilience
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={
        "sslmode": "require", 
        "connect_timeout": 30,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    } if "sqlite" not in settings.DATABASE_URL else {"check_same_thread": False},
    poolclass=NullPool if "sqlite" not in settings.DATABASE_URL else None,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to yield session for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
