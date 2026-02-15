from __future__ import annotations

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.core.database import get_db
from app.models import User, UserStats
from app.schemas.auth import AuthResponse, LoginRequest, MeResponse, RegisterRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": "User already exists"},
        )

    user = User(
        firstName=payload.firstName,
        lastName=payload.lastName,
        email=payload.email,
        password=hash_password(payload.password),
        role="STUDENT",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    stats = UserStats(userId=user.id)
    db.add(stats)
    db.commit()

    token = create_access_token({"id": user.id, "role": user.role})
    return AuthResponse(
        id=user.id,
        firstName=user.firstName,
        lastName=user.lastName,
        email=user.email,
        avatar=user.avatar,
        role=user.role,
        token=token,
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"message": "Invalid email or password"},
        )

    token = create_access_token({"id": user.id, "role": user.role})
    return AuthResponse(
        id=user.id,
        firstName=user.firstName,
        lastName=user.lastName,
        email=user.email,
        avatar=user.avatar,
        role=user.role,
        token=token,
    )


@router.get("/me", response_model=MeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
