from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# If using PostgreSQL, format is typically: postgresql://user:pass@localhost/dbname
# If using SQLite for dev, it's sqlite:///./voting.db

# Since SQLAlchemy core handles both, we just pass the URL from config.
# Optimized engine for Render/Postgres resilience
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=(
        {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL 
        else {"sslmode": "require", "connect_timeout": 10}
    ),
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10
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
