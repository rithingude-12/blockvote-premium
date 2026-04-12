import sys
import os
from contextlib import asynccontextmanager
import time

# Add the current directory to path if needed (for relative imports in some environments)
sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Relative imports since this is in backend/app/main.py
from .config import settings
from .database import engine, Base, SessionLocal
from .routers import auth, voters, voting, elections
from .models.admin import Admin, AdminRole
from .middleware.auth import get_password_hash

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Database Initialization & Admin Seeding with robustness for Render SSL issues
    max_retries = 5
    retry_delay = 2 # seconds
    
    for attempt in range(max_retries):
        try:
            print(f"Attempting database initialization (Attempt {attempt + 1}/{max_retries})...")
            # Create tables if they don't exist
            Base.metadata.create_all(bind=engine)
            
            print(f"Attempting superadmin seeding (Attempt {attempt + 1}/{max_retries})...")
            db: Session = SessionLocal()
            try:
                # Ensure superadmin exists and has the correct password/status
                admin = db.query(Admin).filter_by(username="superadmin").first()
                if not admin:
                    print("Action: Creating default superadmin: username='superadmin'")
                    admin = Admin(
                        username="superadmin",
                        email="admin@blockvote.com",
                        password_hash=get_password_hash("Admin@123456"),
                        role=AdminRole.super_admin,
                        is_active=True
                    )
                    db.add(admin)
                else:
                    print("Action: Forcing superadmin reset/active status...")
                    admin.password_hash = get_password_hash("Admin@123456")
                    admin.is_active = True
                    if admin.email.endswith(".local"):
                        admin.email = "admin@blockvote.com"
                
                db.commit()
                print("Superadmin user ensured successfully.")
            finally:
                db.close()
            
            break # If we get here, initialization succeeded
        except Exception as e:
            print(f"Startup attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2 # Exponential backoff
            else:
                print("CRITICAL: Application failed to initialize database after all retries.")
    yield

app = FastAPI(
    title="Blockchain-Based Voting System API",
    description="API for managing elections, voter registrations, biometrics, and blockchain voting",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for production stability
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome back to BlockVote - Active and Stable"}

@app.get("/api/health")
def health_check():
    """Robust health check for monitoring"""
    return {
        "status": "healthy",
        "timestamp": os.getenv("RENDER_SITE_ID", "live"),
        "version": "1.0.2-resilient"
    }

@app.get("/api/ping")
def ping():
    """Fastest possible endpoint for heartbeat"""
    return "pong"

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(voters.router, prefix="/api/voters", tags=["Voters"])
app.include_router(voting.router, prefix="/api/voting", tags=["Voting"])
app.include_router(elections.router_elections, prefix="/api/elections", tags=["Elections"])
app.include_router(elections.router_candidates, prefix="/api/candidates", tags=["Candidates"])

# Handler for Vercel/serverless
handler = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
