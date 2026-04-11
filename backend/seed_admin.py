import asyncio
import sys
import uuid
import uuid
from sqlalchemy.orm import Session
from passlib.context import CryptContext

# Load app context
sys.path.append('.') # Ensure backend is in path
from app.database import SessionLocal, Base, engine
from app.models.admin import Admin, AdminRole

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def seed_admin():
    db: Session = SessionLocal()
    
    # Check if superadmin exists
    admin = db.query(Admin).filter(Admin.username == 'superadmin').first()
    if not admin:
        print("Creating superadmin user...")
        pwd_hash = pwd_context.hash('Admin@123456')
        new_admin = Admin(
            id=str(uuid.uuid4()),
            username='superadmin',
            email='admin@blockvote.com',
            password_hash=pwd_hash,
            role=AdminRole.super_admin
        )
        db.add(new_admin)
        db.commit()
        print("Super admin created successfully.")
    else:
        print("Superadmin already exists.")
        
    db.close()

if __name__ == "__main__":
    seed_admin()
