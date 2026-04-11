from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.voter import Voter
from ..models.admin import Admin
from ..schemas.voter import VoterRegisterRequest, VoterResponse, VoterUpdate
from ..services.biometric import prepare_face_data, prepare_fingerprint_data
from ..services.crypto import get_keccak256, generate_salt
from ..middleware.auth import admin_required

router = APIRouter()

@router.post("/register", response_model=VoterResponse)
def register_voter(
    request: VoterRegisterRequest, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_required(["super_admin", "election_administrator"]))
):
    # Check if voter already exists
    if db.query(Voter).filter(Voter.voter_id == request.voter_id).first():
        raise HTTPException(status_code=400, detail="Voter ID already registered")

    salt = generate_salt()
    
    # Process face
    try:
        enc_face, hash_face = prepare_face_data(request.face_image_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid face data: {str(e)}")
        
    # Process fingerprint if provided
    enc_fp, hash_fp = None, None
    if request.fingerprint_image_base64:
        try:
            enc_fp, hash_fp = prepare_fingerprint_data(request.fingerprint_image_base64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid fingerprint data: {str(e)}")

    # Generate Blockchain ID
    blockchain_id = get_keccak256(request.voter_id + salt)

    new_voter = Voter(
        voter_id=request.voter_id,
        full_name=request.full_name,
        address=request.address,
        age=request.age,
        constituency_id=request.constituency_id,
        face_embedding_hash=hash_face,
        fingerprint_template_hash=hash_fp,
        biometric_salt=salt,
        encrypted_face_embedding=enc_face,
        encrypted_fingerprint_template=enc_fp,
        blockchain_voter_id=blockchain_id
    )
    
    db.add(new_voter)
    db.commit()
    db.refresh(new_voter)
    
    return new_voter

@router.get("", response_model=list[VoterResponse])
def get_voters(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_required(["super_admin", "election_administrator", "polling_officer"]))
):
    return db.query(Voter).offset(skip).limit(limit).all()

@router.get("/{voter_id}", response_model=VoterResponse)
def get_voter(
    voter_id: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_required(["super_admin", "election_administrator", "polling_officer"]))
):
    voter = db.query(Voter).filter(Voter.id == voter_id).first()
    if not voter:
        raise HTTPException(status_code=404, detail="Voter not found")
    return voter

@router.put("/{voter_id}", response_model=VoterResponse)
def update_voter(
    voter_id: str,
    update_data: VoterUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_required(["super_admin", "election_administrator"]))
):
    voter = db.query(Voter).filter(Voter.id == voter_id).first()
    if not voter:
        raise HTTPException(status_code=404, detail="Voter not found")
        
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(voter, key, value)
        
    db.commit()
    db.refresh(voter)
    return voter

@router.delete("/{voter_id}")
def delete_voter(
    voter_id: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(admin_required(["super_admin"]))
):
    voter = db.query(Voter).filter(Voter.id == voter_id).first()
    if not voter:
        raise HTTPException(status_code=404, detail="Voter not found")
    db.delete(voter)
    db.commit()
    return {"message": "Voter deleted successfully"}
