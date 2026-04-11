import asyncio
import os
from sqlalchemy import create_engine
from app.database import Base
from dotenv import load_dotenv

load_dotenv()

# We must import all models so Base knows about them before create_all
from app.models.admin import Admin
from app.models.election import Election, Constituency, Candidate
from app.models.voter import Voter, VoteTally
from app.models.audit import AuditLog

def init_postgres():
    print("Connecting to Supabase PostgreSQL...")
    engine = create_engine(os.getenv("DATABASE_URL"))
    
    print("Creating all tables from SQLAlchemy metadata...")
    Base.metadata.create_all(bind=engine)
    print("✅ Successfully built PostgreSQL schema in the cloud!")

if __name__ == "__main__":
    init_postgres()
