from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from ..database import get_db
from ..models.voter import Voter, AuthAttempt, AuthMethod, AuthOutcome, VoteSubmission, VoteTally
from ..models.election import Election, ElectionStatus, Candidate
from ..schemas.voter import VoterAuthRequest, VoteCastRequest
from ..services.biometric import verify_face, verify_fingerprint
from ..config import settings
# from ..services.blockchain import blockchain_service

router = APIRouter()

@router.post("/authenticate/{method}")
def authenticate_voter(
    method: str,
    request: VoterAuthRequest,
    db: Session = Depends(get_db)
):
    voter = None
    similarity = 0.0
    auth_success = False

    if request.voter_id:
        voter = db.query(Voter).filter(Voter.voter_id == request.voter_id).first()
        if not voter:
            raise HTTPException(status_code=404, detail="Voter not found")
            
        try:
            if method == "face":
                if not request.face_image_base64:
                    raise ValueError("Face image required")
                similarity = verify_face(request.face_image_base64, voter.encrypted_face_embedding)
                if similarity >= settings.FACE_THRESHOLD:
                    auth_success = True
            elif method == "fingerprint":
                if not request.fingerprint_image_base64:
                    raise ValueError("Fingerprint image required")
                if not voter.encrypted_fingerprint_template:
                    raise ValueError("No fingerprint enrolled")
                similarity = verify_fingerprint(request.fingerprint_image_base64, voter.encrypted_fingerprint_template)
                if similarity >= settings.FINGERPRINT_THRESHOLD:
                    auth_success = True
            else:
                raise HTTPException(status_code=400, detail="Invalid method")
        except Exception as e:
            auth_success = False
            print(f"Auth error: {e}")
            
    else:
        # 1:N Match - Scan all voters to find the highest match
        if method != "face":
            raise HTTPException(status_code=400, detail="Voter ID is required for fingerprint authentication")
            
        if not request.face_image_base64:
            raise HTTPException(status_code=400, detail="Face image required for 1:N search")
            
        all_voters = db.query(Voter).all()
        best_match = None
        best_sim = 0.0
        
        # In a real production system, use FaceNet + Faiss for fast 1:N search.
        # This linear scan is only suitable for small demo databases.
        for v in all_voters:
            if v.encrypted_face_embedding:
                try:
                    sim = verify_face(request.face_image_base64, v.encrypted_face_embedding)
                    if sim > best_sim:
                        best_sim = sim
                        best_match = v
                except Exception:
                    continue
                    
        if best_match and best_sim >= settings.FACE_THRESHOLD:
            voter = best_match
            similarity = best_sim
            auth_success = True
        else:
            raise HTTPException(status_code=404, detail="No matching face found in the voter database")

    if voter.locked_out:
        # Check if lockout expired
        if (datetime.utcnow() - voter.lockout_at).total_seconds() < (settings.LOCKOUT_DURATION_MINUTES * 60):
            raise HTTPException(status_code=403, detail="Account is temporarily locked")
        else:
            voter.locked_out = False
            voter.failed_auth_count = 0
            db.commit()

    if voter.has_voted:
        raise HTTPException(status_code=400, detail="Voter has already cast their vote")

    session_id = str(uuid.uuid4())
    
    attempt = AuthAttempt(
        voter_id=voter.id,
        session_id=session_id,
        polling_station=request.polling_station,
        auth_method=method,
        outcome=AuthOutcome.success if auth_success else AuthOutcome.failure,
        similarity_score=similarity,
        attempted_at=datetime.utcnow()
    )
    
    if not auth_success:
        voter.failed_auth_count += 1
        if voter.failed_auth_count >= settings.MAX_AUTH_ATTEMPTS:
            voter.locked_out = True
            voter.lockout_at = datetime.utcnow()
            attempt.outcome = AuthOutcome.lockout
    else:
        voter.failed_auth_count = 0

    db.add(attempt)
    db.commit()

    if not auth_success:
        if voter.locked_out:
            raise HTTPException(status_code=403, detail="Too many failed attempts. Account locked.")
        raise HTTPException(status_code=401, detail="Authentication failed")

    return {
        "message": "Authentication successful",
        "session_id": session_id,
        "voter_details": {
            "id": voter.id,
            "full_name": voter.full_name,
            "constituency_id": voter.constituency_id,
            "blockchain_voter_id": voter.blockchain_voter_id
        }
    }

@router.post("/cast-vote")
def cast_vote(
    request: VoteCastRequest,
    db: Session = Depends(get_db)
):
    voter = db.query(Voter).filter(Voter.id == request.voter_id).first()
    if not voter:
        raise HTTPException(status_code=404, detail="Voter not found")

    if voter.has_voted:
        raise HTTPException(status_code=400, detail="Already voted")

    election = db.query(Election).filter(Election.id == request.election_id).first()
    if not election or election.status != ElectionStatus.active:
        raise HTTPException(status_code=400, detail="Election is not active")

    # Verify session (in a production system we'd check if session_id is valid and unexpired in Redis or DB)
    auth_attempt = db.query(AuthAttempt).filter(
        AuthAttempt.session_id == request.session_id,
        AuthAttempt.voter_id == voter.id,
        AuthAttempt.outcome == AuthOutcome.success
    ).first()
    if not auth_attempt:
        raise HTTPException(status_code=401, detail="Invalid voting session")

    # In a real deployed app, send to blockchain via Web3.py
    # Here we simulate the blockchain success and record it locally.
    tx_hash = "0x" + str(uuid.uuid4()).replace("-", "") # Simulated hash
    
    submission = VoteSubmission(
        voter_id=voter.id,
        election_id=election.id,
        session_id=request.session_id,
        tx_hash=tx_hash,
        block_number=0,
        gas_used=21000
    )
    
    # Securely increment the anonymous tally
    tally = db.query(VoteTally).filter(
        VoteTally.election_id == election.id,
        VoteTally.candidate_id == request.candidate_id
    ).first()
    
    if not tally:
        tally = VoteTally(
            election_id=election.id,
            candidate_id=request.candidate_id,
            vote_count=1
        )
        db.add(tally)
    else:
        tally.vote_count += 1
    
    voter.has_voted = True
    voter.voted_at = datetime.utcnow()
    voter.vote_tx_hash = tx_hash
    
    db.add(submission)
    db.commit()

    return {
        "message": "Vote cast successfully",
        "transaction_hash": tx_hash
    }
