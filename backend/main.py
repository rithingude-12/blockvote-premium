import sys
import os
sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from sqlalchemy.orm import Session

from app.routers import auth, voters, voting, elections

try:
    # Create tables in sqlite if they don't exist
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
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to the Blockchain-Based Voting System API - Active"}

@app.get("/api/health")
def health_check():
    """Lightweight health check for the API"""
    return {
        "status": "healthy",
        "timestamp": os.getenv("RENDER_SITE_ID", "local"),
        "version": "1.0.0"
    }

@app.get("/api/ping")
def ping():
    """Ultra-fast ping endpoint with zero dependencies"""
    return "pong"

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(voters.router, prefix="/api/voters", tags=["Voters"])
app.include_router(voting.router, prefix="/api/voting", tags=["Voting"])
app.include_router(elections.router_elections, prefix="/api/elections", tags=["Elections"])
app.include_router(elections.router_candidates, prefix="/api/candidates", tags=["Candidates"])

# Create default admin if DB is fresh
@app.on_event("startup")
def create_default_admin():
    from app.database import SessionLocal
    from app.models.admin import Admin, AdminRole
    from app.middleware.auth import get_password_hash
    
    db: Session = SessionLocal()
    
    try:
        # Ensure superadmin exists and has the correct password/status
        admin = db.query(Admin).filter_by(username="superadmin").first()
        if not admin:
            print("Creating default superadmin: username='superadmin', password='Admin@123456'")
            admin = Admin(
                username="superadmin",
                email="admin@blockvote.com",
                password_hash=get_password_hash("Admin@123456"),
                role=AdminRole.super_admin,
                is_active=True
            )
            db.add(admin)
        else:
            print("Forcing superadmin password reset and active status...")
            admin.password_hash = get_password_hash("Admin@123456")
            admin.is_active = True
            if admin.email.endswith(".local"):
                admin.email = "admin@blockvote.com"
        
        db.commit()
        print("Superadmin user ensured successfully.")
    except Exception as e:
        print(f"Error creating superadmin: {e}")
        db.rollback()
    finally:
        db.close()

# For Vercel serverless deployment
handler = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
