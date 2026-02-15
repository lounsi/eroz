from __future__ import annotations

import random
import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import (
    Classroom,
    Enrollment,
    Series,
    SeriesImage,
    SeriesProgress,
    TrainingSession,
    User,
    UserStats,
)

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


def _gen_code() -> str:
    return secrets.token_urlsafe(6)[:8].upper()


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
    # ── Users ──────────────────────────────────────────────
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
            "email": "l.becker@eroz.com",
            "password": "prof123",
            "firstName": "Laurent",
            "lastName": "Becker",
            "role": "PROF",
            "sessions": 20,
            "streak": 10,
        },
        {
            "email": "s.mercier@eroz.com",
            "password": "prof123",
            "firstName": "Sophie",
            "lastName": "Mercier",
            "role": "PROF",
            "sessions": 18,
            "streak": 8,
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
            "email": "julie.dupont@edu.fr",
            "password": "student123",
            "firstName": "Julie",
            "lastName": "Dupont",
            "role": "STUDENT",
            "sessions": 10,
            "streak": 3,
        },
        {
            "email": "lucas.bernard@edu.fr",
            "password": "student123",
            "firstName": "Lucas",
            "lastName": "Bernard",
            "role": "STUDENT",
            "sessions": 15,
            "streak": 7,
        },
        {
            "email": "emma.petit@edu.fr",
            "password": "student123",
            "firstName": "Emma",
            "lastName": "Petit",
            "role": "STUDENT",
            "sessions": 8,
            "streak": 2,
        },
        {
            "email": "hugo.leroy@edu.fr",
            "password": "student123",
            "firstName": "Hugo",
            "lastName": "Leroy",
            "role": "STUDENT",
            "sessions": 14,
            "streak": 6,
        },
        {
            "email": "lea.moreau@edu.fr",
            "password": "student123",
            "firstName": "Léa",
            "lastName": "Moreau",
            "role": "STUDENT",
            "sessions": 11,
            "streak": 4,
        },
        {
            "email": "nathan.garcia@edu.fr",
            "password": "student123",
            "firstName": "Nathan",
            "lastName": "Garcia",
            "role": "STUDENT",
            "sessions": 9,
            "streak": 3,
        },
        {
            "email": "chloe.roux@edu.fr",
            "password": "student123",
            "firstName": "Chloé",
            "lastName": "Roux",
            "role": "STUDENT",
            "sessions": 13,
            "streak": 5,
        },
    ]

    created_users: dict[str, User] = {}

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

        created_users[entry["email"]] = user

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

    # ── Classes & Series ───────────────────────────────────
    # ── Classes & Series ───────────────────────────────────
    # Removed global check to allow selective reseeding

    prof1 = created_users.get("l.becker@eroz.com")
    prof2 = created_users.get("s.mercier@eroz.com")
    if not prof1 or not prof2:
        return

    students_group_1 = [
        created_users[e]
        for e in [
            "thomas.martin@edu.fr",
            "julie.dupont@edu.fr",
            "lucas.bernard@edu.fr",
            "emma.petit@edu.fr",
        ]
        if e in created_users
    ]
    students_group_2 = [
        created_users[e]
        for e in [
            "hugo.leroy@edu.fr",
            "lea.moreau@edu.fr",
            "nathan.garcia@edu.fr",
            "chloe.roux@edu.fr",
        ]
        if e in created_users
    ]

    # Fake IRM image URLs (using placeholder paths)
    irm_images = [
        "/uploads/irm_sample_01.jpg",
        "/uploads/irm_sample_02.jpg",
        "/uploads/irm_sample_03.jpg",
        "/uploads/irm_sample_04.jpg",
        "/uploads/irm_sample_05.jpg",
    ]

    # Classe 1
    class1 = db.query(Classroom).filter(Classroom.code == "RADL3024").first()
    if not class1:
        class1 = Classroom(
            name="Radiologie L3 — 2024",
            description="Introduction à l'imagerie médicale et analyse de clichés radiologiques pour les étudiants de 3ème année.",
            code="RADL3024",
            ownerId=prof1.id,
        )
        db.add(class1)
        db.commit()
        db.refresh(class1)
        
        for student in students_group_1:
             # Check enrollment to avoid duplicate
             if not db.query(Enrollment).filter(Enrollment.userId == student.id, Enrollment.classroomId == class1.id).first():
                db.add(Enrollment(userId=student.id, classroomId=class1.id))
        db.commit()

    # Classe 2
    class2 = db.query(Classroom).filter(Classroom.code == "IMGM1024").first()
    if not class2:
        class2 = Classroom(
            name="Imagerie Avancée M1 — 2024",
            description="Techniques avancées d'imagerie : IRM, scanner, et analyse par IA pour le diagnostic médical.",
            code="IMGM1024",
            ownerId=prof2.id,
        )
        db.add(class2)
        db.commit()
        db.refresh(class2)

        for student in students_group_2:
            if not db.query(Enrollment).filter(Enrollment.userId == student.id, Enrollment.classroomId == class2.id).first():
                db.add(Enrollment(userId=student.id, classroomId=class2.id))
        db.commit()

    # Series for Class 1
    # Series 1
    series1 = db.query(Series).filter(Series.code == "AXBR2024").first()
    if not series1:
        series1 = Series(
            title="Anatomie cérébrale — Coupes axiales",
            description="Identifier les structures cérébrales principales sur des coupes axiales IRM.",
            difficulty="EASY",
            code="AXBR2024",
            classroomId=class1.id,
            createdById=prof1.id,
        )
        db.add(series1)
        db.commit()
        db.refresh(series1)
        for idx, url in enumerate(irm_images[:3]):
            db.add(SeriesImage(seriesId=series1.id, imageUrl=url, orderIndex=idx))
        db.commit()

    # Series 2
    series2 = db.query(Series).filter(Series.code == "TUMO2024").first()
    if not series2:
        series2 = Series(
            title="Pathologies tumorales — Détection",
            description="Repérer et classifier les anomalies tumorales sur des IRM cérébrales.",
            difficulty="HARD",
            code="TUMO2024",
            classroomId=class1.id,
            createdById=prof1.id,
        )
        db.add(series2)
        db.commit()
        db.refresh(series2)
        for idx, url in enumerate(irm_images[:4]):
            db.add(SeriesImage(seriesId=series2.id, imageUrl=url, orderIndex=idx))
        db.commit()

    # Series for Class 2
    # Series 3
    series3 = db.query(Series).filter(Series.code == "MEDL2024").first()
    if not series3:
        series3 = Series(
            title="IRM médullaire — Analyse fondamentale",
            description="Analyser les coupes IRM de la moelle épinière et identifier les pathologies courantes.",
            difficulty="MEDIUM",
            code="MEDL2024",
            classroomId=class2.id,
            createdById=prof2.id,
        )
        db.add(series3)
        db.commit()
        db.refresh(series3)
        for idx, url in enumerate(irm_images[:3]):
            db.add(SeriesImage(seriesId=series3.id, imageUrl=url, orderIndex=idx))
        db.commit()

    # Series 4
    series4 = db.query(Series).filter(Series.code == "THOX2024").first()
    if not series4:
        series4 = Series(
            title="Scanner thoracique — Interprétation",
            description="Interpréter des scanners thoraciques et identifier les anomalies pulmonaires.",
            difficulty="MEDIUM",
            code="THOX2024",
            classroomId=class2.id,
            createdById=prof2.id,
        )
        db.add(series4)
        db.commit()
        db.refresh(series4)
        for idx, url in enumerate(irm_images):
            db.add(SeriesImage(seriesId=series4.id, imageUrl=url, orderIndex=idx))
        db.commit()

    # ── Series Progress (fake data) ───────────────────────
    now = datetime.utcnow()

    # Pre-fetch existing progress to avoid UniqueConstraint violations
    all_students = students_group_1 + students_group_2
    student_ids = [s.id for s in all_students]
    
    existing_progress_keys = set()
    if student_ids:
        rows = db.query(SeriesProgress.userId, SeriesProgress.seriesId).filter(
            SeriesProgress.userId.in_(student_ids)
        ).all()
        existing_progress_keys = {(r[0], r[1]) for r in rows}

    def add_progress_if_new(progress):
        key = (progress.userId, progress.seriesId)
        if key not in existing_progress_keys:
            db.add(progress)
            existing_progress_keys.add(key)

    # Class 1 students progress on series 1 & 2
    for student in students_group_1:
        # Series 1 - most students completed
        roll = random.random()
        if roll < 0.6:
            add_progress_if_new(SeriesProgress(
                userId=student.id,
                seriesId=series1.id,
                status="COMPLETED",
                precision=round(random.uniform(65, 95), 1),
                score=random.randint(600, 950),
                startedAt=now - timedelta(days=random.randint(3, 7)),
                completedAt=now - timedelta(days=random.randint(0, 2)),
            ))
        elif roll < 0.85:
            add_progress_if_new(SeriesProgress(
                userId=student.id,
                seriesId=series1.id,
                status="IN_PROGRESS",
                startedAt=now - timedelta(days=random.randint(1, 3)),
            ))
        # else NOT_STARTED (no entry)

        # Series 2 - fewer completed
        roll = random.random()
        if roll < 0.3:
            add_progress_if_new(SeriesProgress(
                userId=student.id,
                seriesId=series2.id,
                status="COMPLETED",
                precision=round(random.uniform(50, 85), 1),
                score=random.randint(400, 800),
                startedAt=now - timedelta(days=random.randint(2, 5)),
                completedAt=now - timedelta(days=random.randint(0, 1)),
            ))
        elif roll < 0.6:
            add_progress_if_new(SeriesProgress(
                userId=student.id,
                seriesId=series2.id,
                status="IN_PROGRESS",
                startedAt=now - timedelta(days=random.randint(1, 3)),
            ))

    # Class 2 students progress on series 3 & 4
    for student in students_group_2:
        roll = random.random()
        if roll < 0.5:
            add_progress_if_new(SeriesProgress(
                userId=student.id,
                seriesId=series3.id,
                status="COMPLETED",
                precision=round(random.uniform(60, 90), 1),
                score=random.randint(500, 900),
                startedAt=now - timedelta(days=random.randint(3, 7)),
                completedAt=now - timedelta(days=random.randint(0, 2)),
            ))
        elif roll < 0.8:
            add_progress_if_new(SeriesProgress(
                userId=student.id,
                seriesId=series3.id,
                status="IN_PROGRESS",
                startedAt=now - timedelta(days=random.randint(1, 3)),
            ))

        roll = random.random()
        if roll < 0.4:
            add_progress_if_new(SeriesProgress(
                userId=student.id,
                seriesId=series4.id,
                status="COMPLETED",
                precision=round(random.uniform(55, 88), 1),
                score=random.randint(450, 850),
                startedAt=now - timedelta(days=random.randint(2, 6)),
                completedAt=now - timedelta(days=random.randint(0, 1)),
            ))
        elif roll < 0.7:
            add_progress_if_new(SeriesProgress(
                userId=student.id,
                seriesId=series4.id,
                status="IN_PROGRESS",
                startedAt=now - timedelta(days=random.randint(1, 2)),
            ))

    db.commit()


