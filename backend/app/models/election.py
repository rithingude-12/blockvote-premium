import uuid
import enum
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from datetime import datetime
from ..database import Base

class ElectionStatus(str, enum.Enum):
    draft = "draft"
    configured = "configured"
    active = "active"
    ended = "ended"
    finalized = "finalized"

class Election(Base):
    __tablename__ = "elections"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default=ElectionStatus.draft.value)
    voting_start_at = Column(DateTime(timezone=True))
    voting_end_at = Column(DateTime(timezone=True))
    
    # We can store addresses as a JSON string for SQLite or JSONB for Postgres
    contract_addresses = Column(String, nullable=True) # E.g. {"controller": "0x...", "registry": "0x...", "booth": "0x...", "tallier": "0x..."}
    network_id = Column(String(50))
    deployer_address = Column(String(255))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class Constituency(Base):
    __tablename__ = "constituencies"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    election_id = Column(String, ForeignKey("elections.id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    on_chain_id = Column(Integer)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    election_id = Column(String, ForeignKey("elections.id", ondelete="CASCADE"))
    constituency_id = Column(String, ForeignKey("constituencies.id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)
    party = Column(String(255))
    bio = Column(Text)
    on_chain_id = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
