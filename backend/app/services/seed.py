from __future__ import annotations

import random
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import TrainingSession, User, UserStats

DIFFICULTIES = {
    "EASY": {"name": "EASY", "multiplier": 1.0},
    "MEDIUM": {"name": "MEDIUM", "multiplier": 1.5},
    "HARD": {"name": "HARD", "multiplier": 2.0},
}


def calculate_level(total_xp: int) -> int:
    return (total_xp // 1000) + 1


def calculate_streak(dates: list[datetime]) -> int:
    if not dates:
        return 0
    unique_days = sorted({d.date() for d in dates}, reverse=True)
    streak = 1
    for idx in range(1, len(unique_days)):
        if (unique_days[idx - 1] - unique_days[idx]).days == 1:
            streak += 1
        else:
            break
    return streak


def create_sessions_and_stats(
    db: Session,
    user: User,
    session_count: int,
    streak_days: int,
    user_name: str,
):
    sessions: list[TrainingSession] = []
    now = datetime.utcnow()
    total_xp = 0

    for i in range(session_count):
        if i < 7:
            days_ago = i
        elif i < session_count * 0.7:
            days_ago = random.randint(0, 6)
        else:
            days_ago = random.randint(7, 20)

        hours = random.randint(8, 19)
        minutes = random.randint(0, 59)

        completed_at = now - timedelta(days=days_ago)
        completed_at = completed_at.replace(hour=hours, minute=minutes, second=0, microsecond=0)

        diff_roll = random.random()
        if diff_roll < 0.35:
            difficulty = DIFFICULTIES["EASY"]
        elif diff_roll < 0.75:
            difficulty = DIFFICULTIES["MEDIUM"]
        else:
            difficulty = DIFFICULTIES["HARD"]

        total_images = random.randint(10, 20)
        correct_answers = random.randint(int(total_images * 0.6), int(total_images * 0.95))
        precision = round((correct_answers / total_images) * 100, 1)
        duration = random.randint(120, 420)

        base_score = int(precision * 10)
        xp_earned = round(base_score * difficulty["multiplier"])
        total_xp += xp_earned

        session = TrainingSession(
            userId=user.id,
            difficulty=difficulty["name"],
            precision=precision,
            duration=duration,
            totalImages=total_images,
            correctAnswers=correct_answers,
            baseScore=base_score,
            multiplier=difficulty["multiplier"],
            xpEarned=xp_earned,
            completedAt=completed_at,
        )
        db.add(session)
        sessions.append(session)

    db.commit()

    total_sessions = len(sessions)
    average_score = round(sum(s.precision for s in sessions) / total_sessions) if total_sessions else 0
    average_time = round(sum(s.duration for s in sessions) / total_sessions) if total_sessions else 0
    level = calculate_level(total_xp)

    stats = db.query(UserStats).filter(UserStats.userId == user.id).first()
    if stats:
        stats.totalXp = total_xp
        stats.level = level
        stats.totalSessions = total_sessions
        stats.averageScore = average_score
        stats.averageTime = average_time
        stats.currentStreak = streak_days
        stats.lastActivityAt = now
    else:
        stats = UserStats(
            userId=user.id,
            totalXp=total_xp,
            level=level,
            totalSessions=total_sessions,
            averageScore=average_score,
            averageTime=average_time,
            currentStreak=streak_days,
            lastActivityAt=now,
        )
        db.add(stats)

    db.commit()


def rebuild_stats_from_sessions(db: Session, user: User):
    sessions = (
        db.query(TrainingSession)
        .filter(TrainingSession.userId == user.id)
        .order_by(TrainingSession.completedAt.asc())
        .all()
    )
    if not sessions:
        return

    total_xp = sum(s.xpEarned for s in sessions)
    total_sessions = len(sessions)
    average_score = round(sum(s.precision for s in sessions) / total_sessions)
    average_time = round(sum(s.duration for s in sessions) / total_sessions)
    level = calculate_level(total_xp)
    last_activity = sessions[-1].completedAt
    streak = calculate_streak([s.completedAt for s in sessions])

    stats = db.query(UserStats).filter(UserStats.userId == user.id).first()
    if not stats:
        stats = UserStats(userId=user.id)
        db.add(stats)

    stats.totalXp = total_xp
    stats.level = level
    stats.totalSessions = total_sessions
    stats.averageScore = average_score
    stats.averageTime = average_time
    stats.currentStreak = streak
    stats.lastActivityAt = last_activity
    db.commit()


def seed_if_needed(db: Session):
    users_to_seed = [
        {
            "email": "admin@eroz.com",
            "password": "admin123",
            "firstName": "Admin",
            "lastName": "Eroz",
            "role": "ADMIN",
            "sessions": 30,
            "streak": 15,
        },
        {
            "email": "thomas.martin@edu.fr",
            "password": "student123",
            "firstName": "Thomas",
            "lastName": "Martin",
            "role": "STUDENT",
            "sessions": 12,
            "streak": 5,
        },
        {
            "email": "prof@eroz.com",
            "password": "prof123",
            "firstName": "Marie",
            "lastName": "Dupont",
            "role": "PROF",
            "sessions": 20,
            "streak": 10,
        },
    ]

    for entry in users_to_seed:
        user = db.query(User).filter(User.email == entry["email"]).first()
        if not user:
            user = User(
                email=entry["email"],
                password=hash_password(entry["password"]),
                firstName=entry["firstName"],
                lastName=entry["lastName"],
                role=entry["role"],
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        has_sessions = (
            db.query(TrainingSession).filter(TrainingSession.userId == user.id).first() is not None
        )
        stats = db.query(UserStats).filter(UserStats.userId == user.id).first()

        if not has_sessions:
            create_sessions_and_stats(
                db,
                user,
                session_count=entry["sessions"],
                streak_days=entry["streak"],
                user_name=entry["firstName"],
            )
        elif not stats:
            rebuild_stats_from_sessions(db, user)
