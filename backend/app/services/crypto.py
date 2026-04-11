import hashlib
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from ..config import settings

def hash_data(data: str) -> str:
    """Generate SHA-256 hash"""
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def get_keccak256(data: str) -> str:
    """Generate Keccak256 hash (same as Ethereum)"""
    from web3 import Web3
    return Web3.keccak(text=data).hex()

def generate_salt() -> str:
    """Generate random salt for biometric storage"""
    return base64.b64encode(os.urandom(16)).decode('utf-8')

class BiometricEncryptor:
    def __init__(self):
        # The encryption key should be exactly 32 bytes
        key_str = settings.BIOMETRIC_ENCRYPTION_KEY
        if len(key_str) < 32:
            key_str = key_str.ljust(32, '0')
        elif len(key_str) > 32:
            key_str = key_str[:32]
        self.key = key_str.encode('utf-8')
        
    def encrypt(self, data: str) -> str:
        """Encrypt biometric data"""
        aesgcm = AESGCM(self.key)
        nonce = os.urandom(12)
        ct = aesgcm.encrypt(nonce, data.encode('utf-8'), None)
        # Store nonce + ciphertext together
        payload = base64.b64encode(nonce + ct).decode('utf-8')
        return payload
        
    def decrypt(self, encrypted_payload: str) -> str:
        """Decrypt biometric data"""
        aesgcm = AESGCM(self.key)
        raw_payload = base64.b64decode(encrypted_payload)
        nonce = raw_payload[:12]
        ct = raw_payload[12:]
        return aesgcm.decrypt(nonce, ct, None).decode('utf-8')

encryptor = BiometricEncryptor()
