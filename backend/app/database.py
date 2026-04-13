from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# If using PostgreSQL, format is typically: postgresql://user:pass@localhost/dbname
# If using SQLite for dev, it's sqlite:///./voting.db

# Optimized engine for Render/Postgres Free Tier resilience using a robust QueuePool
# We do NOT use NullPool here, because establishing a new TLS connection for every web request
# has a high chance of failing with "SSL connection closed unexpectedly" on the Free Tier.
# Instead, we keep a small pool of warm connections and pre-ping them to ensure they are alive.
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
    pool_pre_ping=True,       # Pings connection before checking out of pool
    pool_recycle=280,         # Recycles connections right before Render's 5-minute idle drop (300s)
    pool_size=5,              # Small pool size to stay well within Postgres limits
    max_overflow=10,
    pool_timeout=30           # Wait up to 30s to get a connection from the pool
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
