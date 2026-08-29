from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt

# ── Config ─────────────────────────────────────────────────────────────────
SECRET_KEY = "gem-sih26100-super-secret-jwt-key-change-in-production"
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 8

# ── Password helpers ────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    pwd_bytes = plain.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    pwd_bytes = plain.encode('utf-8')
    hashed_bytes = hashed.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

# ── JWT helpers ─────────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    payload = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
