from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from ..database import get_db
from ..models.election import Election, Constituency, Candidate, ElectionStatus
from ..models.admin import Admin
from ..models.voter import VoteTally
from ..schemas.election import (
    ElectionCreate, ElectionResponse, ElectionUpdate,
    ConstituencyCreate, ConstituencyResponse,
    CandidateCreate, CandidateResponse, VoteTallyResponse
)
from ..middleware.auth import admin_required

router_elections = APIRouter()
router_candidates = APIRouter()

# --- Elections ---

@router_elections.post("", response_model=ElectionResponse)
def create_election(
    request: ElectionCreate, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_required(["super_admin", "election_administrator"]))
):
    election = Election(**request.dict())
    db.add(election)
    db.commit()
    db.refresh(election)
    return election

@router_elections.get("", response_model=List[ElectionResponse])
def list_elections(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_required())  # any admin
):
    return db.query(Election).offset(skip).limit(limit).all()

@router_elections.put("/{election_id}/start")
def start_election(
    election_id: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_required(["super_admin", "election_administrator"]))
):
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    
    if election.status == ElectionStatus.active:
        raise HTTPException(status_code=400, detail="Election is already active")
        
    election.status = ElectionStatus.active
    election.voting_start_at = datetime.utcnow()
    db.commit()
    
    # In a real app, call blockchain_service here to start down contract
    return {"message": "Election started"}

@router_elections.put("/{election_id}/close")
def close_election(
    election_id: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_required(["super_admin", "election_administrator"]))
):
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    
    if election.status != ElectionStatus.active:
        raise HTTPException(status_code=400, detail="Election must be active to close")
        
    election.status = ElectionStatus.ended
    election.voting_end_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Election closed"}

@router_elections.put("/{election_id}", response_model=ElectionResponse)
def update_election(
    election_id: str,
    update_data: ElectionUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_required(["super_admin", "election_administrator"]))
):
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
        
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(election, key, value)
        
    db.commit()
    db.refresh(election)
    return election

@router_elections.delete("/{election_id}")
def delete_election(
    election_id: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_required(["super_admin"]))
):
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
        
    db.delete(election)
    db.commit()
    return {"message": "Election deleted successfully"}

@router_elections.get("/{election_id}/results", response_model=List[VoteTallyResponse])
def get_election_results(
    election_id: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_required())
):
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
        
    tallies = db.query(VoteTally).filter(VoteTally.election_id == election_id).all()
    return tallies

# --- Constituencies ---

@router_elections.post("/constituencies", response_model=ConstituencyResponse)
def create_constituency(
    request: ConstituencyCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_required(["super_admin", "election_administrator"]))
):
    constituency = Constituency(**request.dict())
    db.add(constituency)
    db.commit()
    db.refresh(constituency)
    return constituency

@router_elections.get("/{election_id}/constituencies", response_model=List[ConstituencyResponse])
def list_constituencies_for_election(
    election_id: str,
    db: Session = Depends(get_db)  # potentially public for voters to see
):
    return db.query(Constituency).filter(Constituency.election_id == election_id).all()

# --- Candidates ---

@router_candidates.post("", response_model=CandidateResponse)
def add_candidate(
    request: CandidateCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_required(["super_admin", "election_administrator"]))
):
    candidate = Candidate(**request.dict())
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate

@router_candidates.get("/constituency/{constituency_id}", response_model=List[CandidateResponse])
def get_candidates_by_constituency(
    constituency_id: str,
    db: Session = Depends(get_db)
):
    return db.query(Candidate).filter(Candidate.constituency_id == constituency_id).filter(Candidate.is_active == True).all()

@router_candidates.get("/election/{election_id}", response_model=List[CandidateResponse])
def get_candidates_by_election(
    election_id: str,
    db: Session = Depends(get_db)
):
    return db.query(Candidate).filter(Candidate.election_id == election_id).filter(Candidate.is_active == True).all()
