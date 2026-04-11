import asyncio
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.election import Election, ElectionStatus, Constituency, Candidate
from app.models.voter import Voter, VoteTally
import uuid
import random

db: Session = SessionLocal()

def generate_fingerprint_test_data():
    print("Starting fingerprint test data generation...")
    # 1. Create Election
    election_id = str(uuid.uuid4())
    election = Election(
        id=election_id,
        name="Biometric Fingerprint Eval",
        description="A specialized test election for fingerprint fallback authentication featuring 5 candidates",
        status=ElectionStatus.active
    )
    db.add(election)
    
    # 2. Create Constituency
    constituency_id = str(uuid.uuid4())
    constituency = Constituency(
        id=constituency_id,
        election_id=election_id,
        name="Biometrics Testing Zone",
        code="BIO-TEST-01"
    )
    db.add(constituency)
    
    # 3. Create 5 Candidates
    candidates = []
    names = ["Emily Chen", "Marcus Johnson", "Sarah Williams", "David Rodriguez", "James Wilson"]
    parties = ["Tech Forward", "Security First", "Progressive Alliance", "Innovation Coalition", "Digital Rights"]
    for i in range(5):
        cand_id = str(uuid.uuid4())
        cand = Candidate(
            id=cand_id,
            election_id=election_id,
            constituency_id=constituency_id,
            name=names[i],
            party=parties[i]
        )
        db.add(cand)
        candidates.append(cand_id)
        
        # Initialize Tally
        tally = VoteTally(
            id=str(uuid.uuid4()),
            election_id=election_id,
            candidate_id=cand_id,
            vote_count=0
        )
        db.add(tally)
    
    db.commit()
    print(f"Created Election: {election.name}")
    print(f"Created Constituency: {constituency.name} with 5 Candidates")

    # 4. Simulate 30 Voters casting votes
    print("Simulating 30 voters specifically for fingerprint tracking...")
    for i in range(1, 31):
        voter_id = str(uuid.uuid4())
        voter = Voter(
            id=voter_id,
            voter_id=f"FINGERPRINT-VOTER-{i:03d}",
            full_name=f"Fingerprint Subject {i}",
            age=random.randint(18, 80),
            constituency_id=constituency_id,
            biometric_salt="fingerprint-test-salt",
            fingerprint_template_hash=f"hash-{uuid.uuid4().hex}", # Mark as having registered fingerprint
            encrypted_fingerprint_template="[ENCRYPTED_SIMULATED_DATA]",
            blockchain_voter_id=f"0x{uuid.uuid4().hex}",
            has_voted=True
        )
        db.add(voter)
        
        # Cast vote for a random candidate
        chosen_cand = random.choice(candidates)
        tally = db.query(VoteTally).filter(VoteTally.candidate_id == chosen_cand).first()
        tally.vote_count += 1
        
    db.commit()
    print("Successfully generated 30 randomized fingerprint test votes!")

if __name__ == "__main__":
    generate_fingerprint_test_data()
    db.close()
