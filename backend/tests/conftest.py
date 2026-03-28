from __future__ import annotations

# Set test environment variables BEFORE importing any app module,
# so that pydantic-settings picks up SQLite instead of PostgreSQL.
import os
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("JWT_SECRET", "test-secret-key-for-testing-with-sufficient-length-32bytes")

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.router import api_router
from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.models import User, UserStats


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture
def client(db):
    test_app = FastAPI()
    test_app.include_router(api_router, prefix="/api")

    def override_get_db():
        yield db

    test_app.dependency_overrides[get_db] = override_get_db
    with TestClient(test_app) as c:
        yield c


def create_user(
    db,
    email: str,
    password: str = "password123",
    role: str = "STUDENT",
    first: str = "Test",
    last: str = "User",
) -> User:
    user = User(
        email=email,
        password=hash_password(password),
        firstName=first,
        lastName=last,
        role=role,
    )
    db.add(user)
    db.flush()
    stats = UserStats(userId=user.id)
    db.add(stats)
    db.commit()
    db.refresh(user)
    return user


def auth_headers(user: User) -> dict:
    token = create_access_token({"id": user.id, "role": user.role})
    return {"Authorization": f"Bearer {token}"}
