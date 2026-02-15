from __future__ import annotations

import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_prof_or_admin
from app.core.database import get_db
from app.models import Classroom, Enrollment, Series, SeriesImage, SeriesProgress, User, TrainingSession, UserStats
from app.schemas.series import (
    SeriesCreate,
    SeriesDetailResponse,
    SeriesImageResponse,
    SeriesResponse,
    StudentSeriesProgressResponse,
    SubmitSeriesResultRequest,
)
from app.schemas.classroom import JoinByCodeRequest

router = APIRouter(prefix="/series", tags=["series"])


def _generate_code() -> str:
    return secrets.token_urlsafe(6)[:8].upper()


# ── Prof / Admin ─────────────────────────────────────────────


@router.post("/", response_model=SeriesResponse, status_code=status.HTTP_201_CREATED)
def create_series(
    payload: SeriesCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_prof_or_admin),
):
    if payload.difficulty not in {"EASY", "MEDIUM", "HARD"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid difficulty")

    classroom = db.get(Classroom, payload.classroomId)
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
    if classroom.ownerId != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your class")

    series = Series(
        title=payload.title,
        description=payload.description,
        difficulty=payload.difficulty,
        code=_generate_code(),
        classroomId=payload.classroomId,
        createdById=current_user.id,
    )
    db.add(series)
    db.commit()
    db.refresh(series)

    # Add images if provided
    for idx, url in enumerate(payload.imageUrls):
        img = SeriesImage(seriesId=series.id, imageUrl=url, orderIndex=idx)
        db.add(img)
    if payload.imageUrls:
        db.commit()

    return SeriesResponse(
        id=series.id,
        title=series.title,
        description=series.description,
        difficulty=series.difficulty,
        code=series.code,
        classroomId=series.classroomId,
        createdById=series.createdById,
        createdAt=series.createdAt,
        imageCount=len(payload.imageUrls),
    )





@router.get("/training/random", response_model=SeriesDetailResponse)
def get_random_training_series(
    difficulty: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    import random
    
    query = db.query(Series.id)
    if difficulty:
        query = query.filter(Series.difficulty == difficulty)
        
    all_ids = [r[0] for r in query.all()]
    
    if not all_ids:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aucune série trouvée pour ce niveau")
        
    chosen_id = random.choice(all_ids)
    
    return get_series_detail(chosen_id, db, current_user)


@router.get("/{series_id}", response_model=SeriesDetailResponse)
def get_series_detail(
    series_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    series = db.get(Series, series_id)
    if not series:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Series not found")

    images = [
        SeriesImageResponse(id=img.id, imageUrl=img.imageUrl, orderIndex=img.orderIndex)
        for img in series.images
    ]

    progress = (
        db.query(SeriesProgress)
        .filter(SeriesProgress.userId == current_user.id, SeriesProgress.seriesId == series_id)
        .first()
    )

    return SeriesDetailResponse(
        id=series.id,
        title=series.title,
        description=series.description,
        difficulty=series.difficulty,
        code=series.code,
        classroomId=series.classroomId,
        createdById=series.createdById,
        createdAt=series.createdAt,
        images=images,
        status=progress.status if progress else None,
        score=progress.score if progress else None,
        precision=progress.precision if progress else None,
    )


@router.delete("/{series_id}")
def delete_series(
    series_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_prof_or_admin),
):
    series = db.get(Series, series_id)
    if not series:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Series not found")

    classroom = db.get(Classroom, series.classroomId)
    if classroom and classroom.ownerId != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your series")

    db.delete(series)
    db.commit()
    return {"message": "Series deleted"}


@router.get("/{series_id}/progress", response_model=list[StudentSeriesProgressResponse])
def get_series_progress(
    series_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_prof_or_admin),
):
    series = db.get(Series, series_id)
    if not series:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Series not found")

    classroom = db.get(Classroom, series.classroomId)
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    # Get all students enrolled in the classroom
    enrollments = db.query(Enrollment).filter(Enrollment.classroomId == classroom.id).all()

    results = []
    for enrollment in enrollments:
        student = enrollment.user
        progress = (
            db.query(SeriesProgress)
            .filter(SeriesProgress.userId == student.id, SeriesProgress.seriesId == series_id)
            .first()
        )
        results.append(
            StudentSeriesProgressResponse(
                studentId=student.id,
                firstName=student.firstName,
                lastName=student.lastName,
                status=progress.status if progress else "NOT_STARTED",
                precision=progress.precision if progress else None,
                score=progress.score if progress else None,
                completedAt=progress.completedAt if progress else None,
            )
        )
    return results


# ── Student ──────────────────────────────────────────────────


@router.post("/join")
def join_series_by_code(
    payload: JoinByCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    series = db.query(Series).filter(Series.code == payload.code.strip().upper()).first()
    if not series:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid series code")

    # Check if already has progress
    existing = (
        db.query(SeriesProgress)
        .filter(SeriesProgress.userId == current_user.id, SeriesProgress.seriesId == series.id)
        .first()
    )
    if existing and existing.status == "COMPLETED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Series already completed")

    if existing:
        return {
            "message": "Already joined",
            "seriesId": series.id,
            "title": series.title,
            "status": existing.status,
        }

    # Create progress entry
    progress = SeriesProgress(
        userId=current_user.id,
        seriesId=series.id,
        status="IN_PROGRESS",
        startedAt=datetime.utcnow(),
    )
    db.add(progress)
    db.commit()

    return {
        "message": "Series joined",
        "seriesId": series.id,
        "title": series.title,
        "status": "IN_PROGRESS",
    }


@router.post("/{series_id}/submit")
def submit_series_result(
    series_id: int,
    payload: SubmitSeriesResultRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    series = db.get(Series, series_id)
    if not series:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Series not found")

    progress = (
        db.query(SeriesProgress)
        .filter(SeriesProgress.userId == current_user.id, SeriesProgress.seriesId == series_id)
        .first()
    )
    if progress and progress.status == "COMPLETED":
        # Allow re-submission for training mode
        pass

    if not progress:
        progress = SeriesProgress(
            userId=current_user.id,
            seriesId=series_id,
            status="COMPLETED",
            precision=payload.precision,
            score=payload.score,
            startedAt=datetime.utcnow(),
            completedAt=datetime.utcnow(),
        )
        db.add(progress)
    else:
        progress.status = "COMPLETED"
        progress.precision = payload.precision
        progress.score = payload.score
        progress.completedAt = datetime.utcnow()

    # ── History & Stats ──────────────────────────────────────
    
    # 1. Create Data for History
    xp_earned = int(payload.score / 10)
    
    session = TrainingSession(
        userId=current_user.id,
        difficulty=series.difficulty,
        precision=payload.precision,
        duration=payload.duration,
        totalImages=payload.totalImages,
        correctAnswers=payload.correctAnswers,
        baseScore=payload.score,
        multiplier=1.0,
        xpEarned=xp_earned,
        completedAt=datetime.utcnow(),
    )
    db.add(session)

    # 2. Update User Aggregated Stats
    stats = db.query(UserStats).filter(UserStats.userId == current_user.id).first()
    if not stats:
        stats = UserStats(userId=current_user.id)
        db.add(stats)

    # Moving average for precision
    current_total_precision = stats.averageScore * stats.totalSessions
    stats.totalSessions += 1
    stats.averageScore = (current_total_precision + payload.precision) / stats.totalSessions
    
    stats.totalXp += xp_earned
    stats.lastActivityAt = datetime.utcnow()

    db.commit()
    return {"message": "Results submitted", "seriesId": series_id}


# ── List series for a classroom ──────────────────────────────


@router.get("/by-class/{class_id}", response_model=list[SeriesResponse])
def list_series_for_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    series_list = (
        db.query(Series)
        .filter(Series.classroomId == class_id)
        .order_by(Series.createdAt.desc())
        .all()
    )
    results = []
    for s in series_list:
        progress = (
            db.query(SeriesProgress)
            .filter(SeriesProgress.userId == current_user.id, SeriesProgress.seriesId == s.id)
            .first()
        )
        status_val = progress.status if progress else None
        
        results.append(
            SeriesResponse(
                id=s.id,
                title=s.title,
                description=s.description,
                difficulty=s.difficulty,
                code=s.code,
                classroomId=s.classroomId,
                createdById=s.createdById,
                createdAt=s.createdAt,
                imageCount=len(s.images),
                status=status_val,
            )
        )
    return results
