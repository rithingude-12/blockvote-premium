import asyncio
import cv2
import base64
import sys
from sqlalchemy.orm import Session
import uuid

# Load app context
sys.path.append('.') # Ensure backend is in path
from app.database import SessionLocal
from app.services.biometric.face import prepare_face_data
from app.services.crypto import get_keccak256, generate_salt
from app.models.voter import Voter
from app.models.election import Constituency

def capture_face():
    """Captures a single frame from the default webcam."""
    print("Opening webcam to capture your face for enrollment...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open camera.")
        return None
        
    print("Look at the camera. Press 'SPACE' to capture, or 'Q' to quit.")
    captured_frame = None
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        cv2.imshow("Enrollment - Press SPACE to capture", frame)
        
        key = cv2.waitKey(1)
        if key % 256 == 32: # SPACE
            captured_frame = frame
            break
        elif key % 256 == 113: # 'q'
            break
            
    cap.release()
    cv2.destroyAllWindows()
    
    if captured_frame is not None:
        # Convert to base64
        _, buffer = cv2.imencode('.jpg', captured_frame)
        b64_str = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{b64_str}"
    
    return None

def enroll_voter(b64_image):
    db: Session = SessionLocal()
    
    # Check/Create a default constituency so we don't fail FK constraints
    constituency = db.query(Constituency).first()
    if not constituency:
        constituency = Constituency(
            id=str(uuid.uuid4()),
            election_id=None, # In a real test we'd link to a real election
            name="Demo District",
            code="DD-01",
            on_chain_id=1
        )
        db.add(constituency)
        db.commit()
    
    salt = generate_salt()
    voter_id = f"VOTER-{str(uuid.uuid4())[:8]}"
    
    try:
        enc_face, hash_face = prepare_face_data(b64_image)
    except Exception as e:
        print(f"Failed to process face: {e}")
        return
        
    blockchain_id = get_keccak256(voter_id + salt)
    
    new_voter = Voter(
        voter_id=voter_id,
        full_name="Testing User",
        address="123 Blockchain Ave",
        age=30,
        constituency_id=constituency.id,
        face_embedding_hash=hash_face,
        biometric_salt=salt,
        encrypted_face_embedding=enc_face,
        blockchain_voter_id=blockchain_id
    )
    
    db.add(new_voter)
    db.commit()
    print(f"\nSuccess! You are now enrolled as {voter_id}.")
    print("Return to the React app and try scanning your face again.")
    db.close()

if __name__ == "__main__":
    image = capture_face()
    if image:
        print("Processing...")
        enroll_voter(image)
    else:
        print("Capture cancelled.")
