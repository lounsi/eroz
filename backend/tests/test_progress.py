from __future__ import annotations

from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import TrainingSession
from tests.conftest import auth_headers, create_user


def test_get_stats_creates_if_missing(client: TestClient, db: Session):
    """GET /progress/stats auto-creates UserStats if the user doesn't have one yet."""
    from app.models import UserStats
    user = create_user(db, "stats@example.com")
    # Delete auto-created stats from fixture
    db.query(UserStats).filter(UserStats.userId == user.id).delete()
    db.commit()

    response = client.get("/api/progress/stats", headers=auth_headers(user))
    assert response.status_code == 200
    data = response.json()
    assert data["totalXp"] == 0
    assert data["level"] == 1


def test_get_stats_returns_existing(client: TestClient, db: Session):
    user = create_user(db, "stats2@example.com")
    response = client.get("/api/progress/stats", headers=auth_headers(user))
    assert response.status_code == 200


def test_get_sessions_empty(client: TestClient, db: Session):
    user = create_user(db, "sessions@example.com")
    response = client.get("/api/progress/sessions", headers=auth_headers(user))
    assert response.status_code == 200
    assert response.json() == []


def test_get_sessions_returns_user_sessions(client: TestClient, db: Session):
    user = create_user(db, "sessions2@example.com")
    session = TrainingSession(
        userId=user.id,
        difficulty="EASY",
        precision=80.0,
        duration=200,
        totalImages=10,
        correctAnswers=8,
        baseScore=800,
        multiplier=1.0,
        xpEarned=800,
        completedAt=datetime.now(timezone.utc),
    )
    db.add(session)
    db.commit()

    response = client.get("/api/progress/sessions?limit=10", headers=auth_headers(user))
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["difficulty"] == "EASY"


def test_weekly_activity(client: TestClient, db: Session):
    user = create_user(db, "weekly@example.com")
    response = client.get("/api/progress/weekly-activity", headers=auth_headers(user))
    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == {"Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"}


def test_xp_progress_no_stats(client: TestClient, db: Session):
    from app.models import UserStats
    user = create_user(db, "xp@example.com")
    db.query(UserStats).filter(UserStats.userId == user.id).delete()
    db.commit()

    response = client.get("/api/progress/xp-progress", headers=auth_headers(user))
    assert response.status_code == 200
    data = response.json()
    assert data["level"] == 1
    assert data["currentXp"] == 0


def test_progress_requires_auth(client: TestClient):
    assert client.get("/api/progress/stats").status_code == 401
    assert client.get("/api/progress/sessions").status_code == 401
    assert client.get("/api/progress/weekly-activity").status_code == 401
