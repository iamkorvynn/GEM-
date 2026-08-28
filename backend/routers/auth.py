from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from backend.database import get_db
from backend.models.models import User
from backend.services.auth_service import verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ── Schemas ─────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    department: str

# ── Dependency: get current user from JWT ────────────────────────────────────
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception
    email: str = payload.get("sub")
    if not email:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise credentials_exception
    return user

# ── POST /api/auth/login ─────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token({
        "sub": user.email,
        "name": user.name,
        "role": user.role,
        "department": user.department,
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "department": user.department,
        }
    }

# ── GET /api/auth/me ──────────────────────────────────────────────────────────
@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user

# ── POST /api/auth/logout  (client-side only — just signals intent) ───────────
@router.post("/logout")
def logout():
    return {"message": "Logged out. Clear token client-side."}
