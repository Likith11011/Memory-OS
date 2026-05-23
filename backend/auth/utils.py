import re
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.handlers.bcrypt import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
import os

# Suppress passlib bcrypt warning
import warnings
warnings.filterwarnings("ignore", message=".*truncate_error.*")
warnings.filterwarnings("ignore", message=".*72 bytes.*")
logging.getLogger("passlib").setLevel(logging.ERROR)

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
    bcrypt__truncate_error=False,
)

security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY", "change-this-before-deployment")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))


def validate_password(password: str) -> tuple[bool, str]:
    if not password:
        return False, "Password is required"
    if len(password) < 6:
        return False, "Password must be at least 6 characters"
    if len(password) > 128:
        return False, "Password is too long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\;'/`~]", password):
        return False, "Password must contain at least one special character"
    return True, ""


def _prepare_password(password: str) -> str:
    """
    Pre-hash password with SHA-256 before passing to bcrypt.
    This ensures the input is always exactly 64 chars (well under 72 bytes).
    SHA-256 hex digest = 64 ASCII characters = 64 bytes, safe for bcrypt.
    """
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    valid, msg = validate_password(password)
    if not valid:
        raise ValueError(msg)
    prepared = _prepare_password(password)
    return pwd_context.hash(prepared)


def verify_password(plain: str, hashed: str) -> bool:
    if not plain or not hashed:
        return False
    try:
        prepared = _prepare_password(plain)
        return pwd_context.verify(prepared, hashed)
    except Exception as e:
        logging.getLogger(__name__).error(f"Password verify error: {e}")
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> Optional[dict]:
    if not token:
        return None
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except JWTError:
        return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not credentials or not credentials.credentials:
        raise credentials_exception
    payload = decode_token(credentials.credentials)
    if not payload:
        raise credentials_exception
    email: str = payload.get("sub")
    if not email or not isinstance(email, str):
        raise credentials_exception
    from auth.models import User
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise credentials_exception
    return user