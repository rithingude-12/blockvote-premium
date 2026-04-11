from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VoterBase(BaseModel):
    voter_id: str
    full_name: str
    address: Optional[str] = None
    age: Optional[int] = None
    constituency_id: Optional[str] = None

class VoterUpdate(BaseModel):
    full_name: Optional[str] = None
    address: Optional[str] = None
    age: Optional[int] = None
    constituency_id: Optional[str] = None

class VoterRegisterRequest(VoterBase):
    # Depending on client, images might come as base64 strings or multipart form
    # We will assume JSON base64 strings for simplicity in this demo.
    face_image_base64: str
    fingerprint_image_base64: Optional[str] = None

class VoterResponse(VoterBase):
    id: str
    blockchain_voter_id: Optional[str] = None
    has_voted: bool
    voted_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class VoterAuthRequest(BaseModel):
    voter_id: Optional[str] = None
    face_image_base64: Optional[str] = None
    fingerprint_image_base64: Optional[str] = None
    session_id: Optional[str] = None
    polling_station: Optional[str] = None

class VoteCastRequest(BaseModel):
    voter_id: str
    election_id: str
    candidate_id: str
    constituency_id: str
    session_id: Optional[str] = None
