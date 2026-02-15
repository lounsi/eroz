from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models import TrainingSession, User, UserStats
from app.schemas.progress import TrainingSessionResponse, UserStatsResponse, XpProgressResponse

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/stats", response_model=UserStatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stats = db.query(UserStats).filter(UserStats.userId == current_user.id).first()
    if not stats:
        stats = UserStats(userId=current_user.id)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return stats


@router.get("/sessions", response_model=list[TrainingSessionResponse])
def get_sessions(
    limit: int = Query(default=10),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(TrainingSession)
        .filter(TrainingSession.userId == current_user.id)
        .order_by(TrainingSession.completedAt.desc())
        .limit(limit)
        .all()
    )
    return sessions


@router.get("/weekly-activity")
def weekly_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    sessions = (
        db.query(TrainingSession)
        .filter(TrainingSession.userId == current_user.id)
        .filter(TrainingSession.completedAt >= week_ago)
        .order_by(TrainingSession.completedAt.asc())
        .all()
    )

    activity = {"Lun": 0, "Mar": 0, "Mer": 0, "Jeu": 0, "Ven": 0, "Sam": 0, "Dim": 0}
    day_names = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

    for session in sessions:
        node_index = (session.completedAt.weekday() + 1) % 7
        day_name = day_names[node_index]
        activity[day_name] += 1

    return activity


@router.get("/xp-progress", response_model=XpProgressResponse)
def xp_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stats = db.query(UserStats).filter(UserStats.userId == current_user.id).first()
    if not stats:
        return XpProgressResponse(
            level=1,
            currentXp=0,
            xpForNextLevel=1000,
            progress=0,
            totalXp=None,
        )

    xp_per_level = 1000
    current_level_xp = stats.totalXp % xp_per_level
    progress = round((current_level_xp / xp_per_level) * 100)

    return XpProgressResponse(
        level=stats.level,
        totalXp=stats.totalXp,
        currentXp=current_level_xp,
        xpForNextLevel=xp_per_level,
        progress=progress,
    )
