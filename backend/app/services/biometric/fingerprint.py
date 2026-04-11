import cv2
import numpy as np
import base64
import json
from ...config import settings
from ..crypto import encryptor, hash_data

def base64_to_image(b64_string: str) -> np.ndarray:
    if "base64," in b64_string:
        b64_string = b64_string.split("base64,")[1]
    img_data = base64.b64decode(b64_string)
    nparr = np.frombuffer(img_data, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

def extract_fingerprint_features(image: np.ndarray) -> np.ndarray:
    """
    Simulated fingerprint feature extraction.
    Uses basic thresholding and resizing for a rough template since gabor filters
    and proper minutiae extraction require complex libraries or C extensions.
    """
    # Equalize
    eq = cv2.equalizeHist(image)
    # Threshold
    _, thresh = cv2.threshold(eq, 127, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    # Resize to standard patch
    resized = cv2.resize(thresh, (64, 64))
    
    return resized.flatten().astype(np.float32)

def prepare_fingerprint_data(b64_image: str):
    img = base64_to_image(b64_image)
    features = extract_fingerprint_features(img)
    
    # Normalize features
    norm = np.linalg.norm(features)
    if norm > 0:
        features = features / norm
        
    features_list = features.tolist()
    features_json = json.dumps(features_list)
    
    encrypted = encryptor.encrypt(features_json)
    hashed = hash_data(features_json + settings.BIOMETRIC_SALT_PEPPER)
    
    return encrypted, hashed

def verify_fingerprint(b64_image: str, stored_encrypted_template: str) -> float:
    new_img = base64_to_image(b64_image)
    new_features = extract_fingerprint_features(new_img)
    
    # Normalize
    n1 = np.linalg.norm(new_features)
    if n1 > 0:
        new_features = new_features / n1
        
    stored_json = encryptor.decrypt(stored_encrypted_template)
    stored_list = json.loads(stored_json)
    stored_features = np.array(stored_list, dtype=np.float32)
    
    similarity = float(np.dot(new_features, stored_features))
    return similarity
