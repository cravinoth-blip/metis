import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordBearer
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "metis-super-secret-key-change-in-production-2024")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
SECURE_COOKIES = os.getenv("SECURE_COOKIES", "false").lower() == "true"

ACCESS_COOKIE = "metis_access_token"
REFRESH_COOKIE = "metis_refresh_token"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)
# auto_error=False so we can fall back to cookie auth without raising immediately
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token() -> tuple[str, str]:
    """Returns (raw_token, sha256_hash). Store the hash in DB; send raw in the cookie."""
    raw = secrets.token_urlsafe(40)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    return raw, token_hash


def verify_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        key=ACCESS_COOKIE,
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=SECURE_COOKIES,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=SECURE_COOKIES,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key=ACCESS_COOKIE, samesite="lax", secure=SECURE_COOKIES)
    response.delete_cookie(key=REFRESH_COOKIE, samesite="lax", secure=SECURE_COOKIES)


def _resolve_user_from_token(token: str):
    from database import SessionLocal
    import models

    payload = verify_token(token)
    if payload is None:
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == int(user_id)).first()
        return user if (user and user.is_active) else None
    finally:
        db.close()


def get_current_user(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme),
):
    """Accepts JWT from HttpOnly cookie (preferred) or Authorization Bearer header."""
    token = request.cookies.get(ACCESS_COOKIE) or bearer_token
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = _resolve_user_from_token(token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_optional_user(request: Request):
    """Returns the authenticated user from cookie, or None. Used for HTML route guards."""
    token = request.cookies.get(ACCESS_COOKIE)
    if not token:
        return None
    return _resolve_user_from_token(token)


def get_current_admin(current_user=Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


def calculate_level(xp: int) -> tuple[int, int]:
    """Returns (level, xp_to_next)"""
    import math
    level = math.floor(xp / 500) + 1
    xp_to_next = (level * 500) - xp
    return level, xp_to_next
