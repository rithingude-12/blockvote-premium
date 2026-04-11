import cv2
import requests
import numpy as np
import base64
import json
from fastapi import HTTPException
from ...config import settings
from ..crypto import encryptor, hash_data

def base64_to_image(b64_string: str) -> np.ndarray:
    # Remove header if present (e.g., data:image/jpeg;base64,)
    if "base64," in b64_string:
        b64_string = b64_string.split("base64,")[1]
    
    img_data = base64.b64decode(b64_string)
    nparr = np.frombuffer(img_data, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

def extract_face_embedding(image: np.ndarray) -> np.ndarray:
    """
    Fallback local simulated embedding if Face++ is unreachable.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Needs cv2.data.haarcascades path
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    if len(faces) > 0:
        x, y, w, h = faces[0]
        face_crop = gray[y:y+h, x:x+w]
        face_norm = cv2.equalizeHist(face_crop)
        resized = cv2.resize(face_norm, (128, 128))
    else:
        eq = cv2.equalizeHist(gray)
        h, w = eq.shape
        cy, cx = h//2, w//2
        resized = cv2.resize(eq[max(0, cy-128):min(h, cy+128), max(0, cx-128):min(w, cx+128)], (128, 128))

    return resized.flatten().astype(np.float32)

def prepare_face_data(b64_image: str):
    """
    For Free Tier Deployment: Instead of hashing the actual face mesh math, 
    we just store the base64 string directly so we can send it to Face++ during login.
    """
    # Simply clean the base64 string for storage
    clean_b64 = b64_image.split("base64,")[1] if "base64," in b64_image else b64_image
    
    encrypted = encryptor.encrypt(json.dumps({"image_base64": clean_b64}))
    hashed = hash_data(clean_b64[:100] + settings.BIOMETRIC_SALT_PEPPER) # simplistic hash of head data
    
    return encrypted, hashed

def verify_face(b64_image: str, stored_encrypted_template: str) -> float:
    """
    Compare new image with stored image using Face++ Compare API.
    Returns a similarity score out of 100.
    """
    try:
        # Load stored baseline image
        stored_json = encryptor.decrypt(stored_encrypted_template)
        stored_data = json.loads(stored_json)
        stored_b64 = stored_data.get("image_base64")
        
        # Clean incoming image
        incoming_b64 = b64_image.split("base64,")[1] if "base64," in b64_image else b64_image
        
        # Call Face++ API
        if settings.FACEPLUSPLUS_API_KEY and settings.FACEPLUSPLUS_API_SECRET:
            url = "https://api-us.faceplusplus.com/facepp/v3/compare"
            payload = {
                'api_key': settings.FACEPLUSPLUS_API_KEY,
                'api_secret': settings.FACEPLUSPLUS_API_SECRET,
                'image_base64_1': stored_b64,
                'image_base64_2': incoming_b64
            }
            
            response = requests.post(url, data=payload)
            result = response.json()
            
            if 'error_message' in result:
                print(f"Face++ API Error: {result['error_message']}")
                raise HTTPException(status_code=400, detail="Facial verification failed. Please try again.")
                
            # Returns a float between 0.0 and 100.0
            return float(result.get('confidence', 0.0))
            
        else:
            # Fallback to local OpenCV math if no API keys exist
            return fallback_verify_face(incoming_b64, stored_b64)
            
    except Exception as e:
        print(f"Verification Error: {e}")
        return 0.0

def fallback_verify_face(new_b64: str, stored_b64: str) -> float:
    # Legacy OpenCV behavior 
    new_img = base64_to_image(new_b64)
    new_emb = extract_face_embedding(new_img)
    n1 = np.linalg.norm(new_emb)
    if n1 > 0: new_emb = new_emb / n1
        
    stored_img = base64_to_image(stored_b64)
    stored_emb = extract_face_embedding(stored_img)
    n2 = np.linalg.norm(stored_emb)
    if n2 > 0: stored_emb = stored_emb / n2
    
    # Cosine similarity converted to 0-100 scale to match Face++
    return float(np.dot(new_emb, stored_emb)) * 100.0
