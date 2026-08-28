from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

# ── Config ─────────────────────────────────────────────────────────────────
SECRET_KEY = "gem-sih26100-super-secret-jwt-key-change-in-production"
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 8

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Password helpers ────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

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
