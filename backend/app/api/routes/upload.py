from __future__ import annotations

import os
import time
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models import User

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_MIME = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


@router.post("/avatar")
def upload_avatar(
    avatar: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if avatar.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format de fichier non supporte. Utilisez JPG, PNG, GIF ou WEBP.",
        )

    ext = Path(avatar.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format de fichier non supporte. Utilisez JPG, PNG, GIF ou WEBP.",
        )

    base_dir = Path(__file__).resolve().parents[3]
    upload_dir = Path(settings.upload_dir)
    if not upload_dir.is_absolute():
        upload_dir = base_dir / upload_dir
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"user-{current_user.id}-{int(time.time() * 1000)}{ext}"
    file_path = upload_dir / filename

    max_size = settings.max_upload_mb * 1024 * 1024
    size = 0

    try:
        with file_path.open("wb") as buffer:
            while True:
                chunk = avatar.file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > max_size:
                    buffer.close()
                    file_path.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Fichier trop volumineux (max 5MB).",
                    )
                buffer.write(chunk)
    finally:
        avatar.file.close()

    avatar_url = f"/uploads/{filename}"
    current_user.avatar = avatar_url
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Avatar mis a jour avec succes",
        "avatar": avatar_url,
        "user": {
            "id": current_user.id,
            "firstName": current_user.firstName,
            "lastName": current_user.lastName,
            "email": current_user.email,
            "role": current_user.role,
            "avatar": current_user.avatar,
        },
    }
