from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base

from .routers import auth, voters, voting, elections

try:
    # Create tables in sqlite if they don't exist
    # In a real setup, alembic should be used.
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
except Exception as e:
    print(f"Database initialization deferred or failed: {e}")


app = FastAPI(
    title="Blockchain-Based Voting System API",
    description="API for managing elections, voter registrations, biometrics, and blockchain voting",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "version": "1.0.1-diagnostic",
        "timestamp": "2026-04-10T10:48Z",
        "message": "Authentication fix applied and force-reset active."
    }

@app.get("/")
def root():
    return {"message": "Welcome to the Blockchain-Based Voting System API - Active", "health_check": "/api/health"}


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(voters.router, prefix="/api/voters", tags=["Voters"])
app.include_router(voting.router, prefix="/api/voting", tags=["Voting"])
app.include_router(elections.router_elections, prefix="/api/elections", tags=["Elections"])
app.include_router(elections.router_candidates, prefix="/api/candidates", tags=["Candidates"])

# Create default admin if DB is fresh
@app.on_event("startup")
def create_default_admin():
    from sqlalchemy.orm import Session
    from .database import SessionLocal
    from .models.admin import Admin, AdminRole
    from .middleware.auth import get_password_hash
    
    # Ensure superadmin exists and has the correct password/status
    print(">>> Starting superadmin seeding check...")
    db: Session = SessionLocal()
    try:
        admin = db.query(Admin).filter_by(username="superadmin").first()

        if not admin:
            print(">>> Action: Creating default superadmin: username='superadmin', password='Admin@123456'")
            admin = Admin(
                username="superadmin",
                email="admin@blockvote.com",
                password_hash=get_password_hash("Admin@123456"),
                role=AdminRole.super_admin,
                is_active=True
            )
            db.add(admin)
        else:
            print(">>> Action: Forcing superadmin password reset and active status...")
            admin.password_hash = get_password_hash("Admin@123456")
            admin.is_active = True
            if admin.email.endswith(".local"):
                admin.email = "admin@blockvote.com"
        
        db.commit()
        print(">>> Superadmin seeding/reset COMPLETED.")
    except Exception as e:
        print(f">>> CRITICAL: Superadmin seeding FAILED: {e}")
    finally:
        db.close()


