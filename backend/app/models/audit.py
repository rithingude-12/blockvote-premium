import uuid
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text
from datetime import datetime
from ..database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = Column(String, ForeignKey("admins.id"))
    action = Column(String)
    target_table = Column(String(100))
    target_id = Column(String)
    details = Column(String) # JSON string
    ip_address = Column(String(45))
    occurred_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class BlockchainTxn(Base):
    __tablename__ = "blockchain_txns"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    election_id = Column(String, ForeignKey("elections.id"))
    tx_type = Column(String)
    tx_hash = Column(String(255), unique=True)
    block_number = Column(Integer)
    from_address = Column(String(255))
    to_address = Column(String(255))
    gas_used = Column(Integer)
    status = Column(String(50))
    raw_event = Column(Text) # JSON string
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
