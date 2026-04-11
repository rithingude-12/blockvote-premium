import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Enum, text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from ..database import Base
import enum

class AdminRole(str, enum.Enum):
    super_admin = "super_admin"
    election_administrator = "election_administrator"
    polling_officer = "polling_officer"
    auditor = "auditor"

class Admin(Base):
    __tablename__ = "admins"

    # Use String for SQLite compatibility if needed, but the schema uses UUID
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(AdminRole), nullable=False)
    mfa_enabled = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
