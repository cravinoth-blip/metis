import hashlib
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    set_auth_cookies,
    clear_auth_cookies,
    get_current_user,
    REFRESH_TOKEN_EXPIRE_DAYS,
    REFRESH_COOKIE,
)

router = APIRouter(tags=["auth"])


def _issue_tokens(user: models.User, db: Session, response: Response) -> str:
    """Create access + refresh tokens, persist refresh token hash, set cookies.
    Returns the raw access token string for the JSON response body."""
    access_token = create_access_token({"sub": str(user.id)})
    raw_refresh, refresh_hash = create_refresh_token()

    # Revoke any existing active refresh tokens for this user (single-session policy)
    db.query(models.RefreshToken).filter(
        models.RefreshToken.user_id == user.id,
        models.RefreshToken.is_revoked == False,  # noqa: E712
    ).update({"is_revoked": True})

    db.add(models.RefreshToken(
        user_id=user.id,
        token_hash=refresh_hash,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    ))
    db.commit()

    set_auth_cookies(response, access_token, raw_refresh)
    return access_token


@router.post("/register", response_model=schemas.Token)
def register(user_data: schemas.UserRegister, response: Response, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(models.User).filter(models.User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    full_name = user_data.full_name or user_data.username
    parts = full_name.strip().split()
    initials = (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else full_name[:2].upper()

    user = models.User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name or "",
        department=user_data.department or "",
        avatar_initials=initials,
        last_login=datetime.utcnow(),
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = _issue_tokens(user, db, response)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    now = datetime.utcnow()
    if user.last_login:
        days_diff = (now.date() - user.last_login.date()).days
        if days_diff == 1:
            user.streak += 1
        elif days_diff > 1:
            user.streak = 1
    else:
        user.streak = 1
    user.last_login = now
    db.commit()

    access_token = _issue_tokens(user, db, response)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_refresh = request.cookies.get(REFRESH_COOKIE)
    if raw_refresh:
        token_hash = hashlib.sha256(raw_refresh.encode()).hexdigest()
        db.query(models.RefreshToken).filter(
            models.RefreshToken.token_hash == token_hash,
        ).update({"is_revoked": True})
        db.commit()
    clear_auth_cookies(response)
    return {"detail": "Logged out"}


@router.post("/refresh", response_model=schemas.Token)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_refresh = request.cookies.get(REFRESH_COOKIE)
    if not raw_refresh:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")

    token_hash = hashlib.sha256(raw_refresh.encode()).hexdigest()
    db_token = db.query(models.RefreshToken).filter(
        models.RefreshToken.token_hash == token_hash,
        models.RefreshToken.is_revoked == False,  # noqa: E712
        models.RefreshToken.expires_at > datetime.utcnow(),
    ).first()

    if not db_token:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user = db.query(models.User).filter(
        models.User.id == db_token.user_id,
        models.User.is_active == True,  # noqa: E712
    ).first()
    if not user:
        clear_auth_cookies(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Revoke current token before issuing new ones (rotation)
    db_token.is_revoked = True
    db.commit()

    access_token = _issue_tokens(user, db, response)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
