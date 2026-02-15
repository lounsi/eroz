from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models import User
from app.schemas.user import UpdateRoleRequest, UserAdminResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserAdminResponse])
def list_users(
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(User)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                User.firstName.ilike(like),
                User.lastName.ilike(like),
                User.email.ilike(like),
            )
        )
    users = query.order_by(User.createdAt.desc()).all()
    return users


@router.put("/{user_id}/role", response_model=UserAdminResponse)
def update_role(
    user_id: int,
    payload: UpdateRoleRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if payload.role not in {"STUDENT", "PROF", "ADMIN"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
