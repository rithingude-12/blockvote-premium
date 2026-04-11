import requests
import base64
import uuid
import time
from app.database import SessionLocal
from app.models.voter import Voter, VoteTally, VoteSubmission
from app.models.election import Election, Constituency, Candidate
from app.services.biometric.face import prepare_face_data
from app.services.biometric.fingerprint import prepare_fingerprint_data, verify_fingerprint
from app.services.crypto import generate_salt, get_keccak256

db = SessionLocal()

def get_test_face_b64():
    import cv2, numpy as np
    dummy_img = np.random.randint(0, 255, (256, 256), dtype=np.uint8)
    _, buffer = cv2.imencode('.png', dummy_img)
    return "data:image/png;base64," + base64.b64encode(buffer).decode('utf-8')

from app.models.election import Election, Constituency, Candidate, ElectionStatus

def run_test():
    print("--- STARTING BIOMETRIC ELECTION TEST RUN ---")
    
    # 1. Setup Data
    election = Election(
        id=str(uuid.uuid4()), name="System Test Election", status=ElectionStatus.active
    )
    db.add(election)
    db.commit()
    
    const = Constituency(
        id=str(uuid.uuid4()), election_id=election.id, name="Test Region", code="TR1"
    )
    db.add(const)
    db.commit()
    
    cand = Candidate(
        id=str(uuid.uuid4()), election_id=election.id, constituency_id=const.id, name="Test Candidate"
    )
    db.add(cand)
    try:
        db.commit()
    except Exception as e:
        import traceback
        with open('err2.txt', 'w') as f:
            f.write(traceback.format_exc())
        print("Setup data commit failed, see err2.txt")
        db.rollback()
        return
    print("[1] Test Election, Constituency, and Candidate created.")

    # 2. Enroll Voter with Biometrics
    b64_face = get_test_face_b64()
    enc_face, hash_face = prepare_face_data(b64_face)
    
    import cv2, numpy as np
    dummy_img = np.random.randint(0, 255, (256, 256), dtype=np.uint8)
    _, buffer = cv2.imencode('.png', dummy_img)
    b64_fingerprint = "data:image/png;base64," + base64.b64encode(buffer).decode('utf-8')
    enc_print, hash_print = prepare_fingerprint_data(b64_fingerprint)
    
    salt = generate_salt()
    voter_id = f"TEST-VOTER-{str(uuid.uuid4())[:6]}"
    
    voter = Voter(
        id=str(uuid.uuid4()),
        voter_id=voter_id,
        full_name="Bio Test Voter",
        constituency_id=const.id,
        biometric_salt=salt,
        blockchain_voter_id=get_keccak256(voter_id + salt),
        face_embedding_hash=hash_face,
        encrypted_face_embedding=enc_face,
        fingerprint_template_hash=hash_print,
        encrypted_fingerprint_template=enc_print
    )
    db.add(voter)
    try:
        db.commit()
    except Exception as e:
        import traceback
        print("Voter commit failed:")
        traceback.print_exc()
        db.rollback()
        return
    print(f"[2] Test Voter created. ID: {voter_id}")

    # 3. Test Face Authentication Route
    print("\n--- Testing Facial Authentication ---")
    api = 'http://localhost:8000/api'
    try:
        r_face = requests.post(f"{api}/voting/authenticate/face", json={
            "voter_id": voter_id,
            "polling_station": "Station 1",
            "face_image_base64": b64_face
        })
        print("FACE AUTH HTTP STATUS:", r_face.status_code)
        
        if r_face.status_code == 200:
            print("FACE AUTH SUCCESS:", r_face.json())
        else:
            print("FACE AUTH FAILED:", r_face.text)
            with open('face_error.txt', 'w') as f:
                f.write(r_face.text)
    except Exception as e:
        print("Face API Request error:", e)

    # 4. Test Fingerprint Authentication Route
    print("\n--- Testing Fingerprint Authentication ---")
    session_id = None
    try:
        r_finger = requests.post(f"{api}/voting/authenticate/fingerprint", json={
            "voter_id": voter_id,
            "polling_station": "Station 1",
            "fingerprint_image_base64": b64_fingerprint
        })
        print("FINGER AUTH HTTP STATUS:", r_finger.status_code)
        if r_finger.status_code == 200:
            print("FINGER AUTH SUCCESS:", r_finger.json())
            session_id = r_finger.json().get('session_id')
        else:
            print("FINGER AUTH FAILED:", r_finger.text)
            session_id = None
    except Exception as e:
        print("Fingerprint API Request error:", e)

    # 5. Test Voting Route
    print("\n--- Testing Cast Vote ---")
    if session_id:
        try:
            r_vote = requests.post(f"{api}/voting/cast-vote", json={
                "voter_id": voter.id,
                "election_id": election.id,
                "candidate_id": cand.id,
                "constituency_id": const.id,
                "session_id": session_id
            })
            print("VOTE HTTP STATUS:", r_vote.status_code)
            if r_vote.status_code == 200:
                print("VOTE SUCCESS:", r_vote.json())
                
                # Verify DB Tally
                tally = db.query(VoteTally).filter(VoteTally.candidate_id == cand.id).first()
                print(f"DATABASE VERIFICATION: Candidate Tally is {tally.vote_count}")
                
                v_check = db.query(Voter).filter(Voter.id == voter.id).first()
                print(f"DATABASE VERIFICATION: Voter has_voted = {v_check.has_voted}")
                
            else:
                print("VOTE FAILED:", r_vote.text)
        except Exception as e:
            print("Vote API Request error:", e)
    else:
        print("Skipped voting test due to failed auth session.")
        
    db.close()

if __name__ == '__main__':
    run_test()
