from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from ..models.election import ElectionStatus

class CandidateBase(BaseModel):
    name: str
    party: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool = True

class CandidateCreate(CandidateBase):
    election_id: str
    constituency_id: str

class CandidateResponse(CandidateBase):
    id: str
    election_id: str
    constituency_id: str
    on_chain_id: Optional[int]
    
    class Config:
        from_attributes = True

class ConstituencyBase(BaseModel):
    name: str
    code: str

class ConstituencyCreate(ConstituencyBase):
    election_id: str

class ConstituencyResponse(ConstituencyBase):
    id: str
    election_id: str
    on_chain_id: Optional[int]
    
    class Config:
        from_attributes = True

class ElectionBase(BaseModel):
    name: str
    description: Optional[str] = None
    voting_start_at: Optional[datetime] = None
    voting_end_at: Optional[datetime] = None

class ElectionCreate(ElectionBase):
    pass

class ElectionResponse(ElectionBase):
    id: str
    status: ElectionStatus
    contract_addresses: Optional[str]
    network_id: Optional[str]
    deployer_address: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class ElectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ElectionStatus] = None
    voting_start_at: Optional[datetime] = None
    voting_end_at: Optional[datetime] = None

class VoteTallyResponse(BaseModel):
    candidate_id: str
    vote_count: int
    
    class Config:
        from_attributes = True
