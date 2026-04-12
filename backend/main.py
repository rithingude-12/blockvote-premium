import sys
import os
sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from sqlalchemy.orm import Session

from app.routers import auth, voters, voting, elections

# Table creation moved inside lifespan for retry resilience

from contextlib import asynccontextmanager
import time

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create default admin if DB is fresh - with RETRY logic for Render resilience
    from app.database import SessionLocal
    from app.models.admin import Admin, AdminRole
    from app.middleware.auth import get_password_hash
    
    max_retries = 5
    retry_delay = 2 # seconds
    
    for attempt in range(max_retries):
        db: Session = SessionLocal()
        try:
            print(f"Attempting database initialization (Attempt {attempt + 1}/{max_retries})...")
            # Create tables if they don't exist
            Base.metadata.create_all(bind=engine)
            
            print(f"Attempting superadmin seeding (Attempt {attempt + 1}/{max_retries})...")
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
            break # Success!
        except Exception as e:
            db.rollback()
            print(f"Seeding attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2 # Exponential backoff
            else:
                print("CRITICAL: Superadmin seeding failed after all retries.")
        finally:
            db.close()
    yield

app = FastAPI(
    title="Blockchain-Based Voting System API",
    description="API for managing elections, voter registrations, biometrics, and blockchain voting",
    version="1.0.0",
    lifespan=lifespan
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

# For Vercel serverless deployment
handler = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
