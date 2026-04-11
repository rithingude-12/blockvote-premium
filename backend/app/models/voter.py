import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, DateTime, Text, Float
from datetime import datetime
from ..database import Base

class AuthMethod(str):
    face = "face"
    fingerprint = "fingerprint"

class AuthOutcome(str):
    success = "success"
    failure = "failure"
    lockout = "lockout"

class Voter(Base):
    __tablename__ = "voters"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    voter_id = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    address = Column(Text)
    age = Column(Integer)
    constituency_id = Column(String, ForeignKey("constituencies.id", ondelete="SET NULL"))
    
    face_embedding_hash = Column(String(255))
    fingerprint_template_hash = Column(String(255))
    biometric_salt = Column(String(255), nullable=False)
    encrypted_face_embedding = Column(Text)
    encrypted_fingerprint_template = Column(Text)
    
    blockchain_voter_id = Column(String(255), unique=True, nullable=False) # Keccak256
    
    has_voted = Column(Boolean, default=False)
    voted_at = Column(DateTime(timezone=True))
    vote_tx_hash = Column(String(255))
    
    failed_auth_count = Column(Integer, default=0)
    locked_out = Column(Boolean, default=False)
    lockout_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class AuthAttempt(Base):
    __tablename__ = "auth_attempts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    voter_id = Column(String, ForeignKey("voters.id", ondelete="CASCADE"))
    session_id = Column(String(255))
    polling_station = Column(String(255))
    auth_method = Column(String)  # Enum AuthMethod
    outcome = Column(String)      # Enum AuthOutcome
    failure_reason = Column(Text)
    similarity_score = Column(Float)
    ip_address = Column(String(45))
    attempted_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class VoteSubmission(Base):
    __tablename__ = "vote_submissions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    voter_id = Column(String, ForeignKey("voters.id", ondelete="CASCADE"))
    election_id = Column(String, ForeignKey("elections.id", ondelete="CASCADE"))
    session_id = Column(String(255))
    tx_hash = Column(String(255), unique=True)
    block_number = Column(Integer)
    gas_used = Column(Integer)
    submitted_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class VoteTally(Base):
    __tablename__ = "vote_tallies"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    election_id = Column(String, ForeignKey("elections.id", ondelete="CASCADE"))
    candidate_id = Column(String, ForeignKey("candidates.id", ondelete="CASCADE"))
    vote_count = Column(Integer, default=0)
    last_updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
