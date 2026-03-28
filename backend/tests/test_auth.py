from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.conftest import auth_headers, create_user


def test_register_success(client: TestClient):
    response = client.post("/api/auth/register", json={
        "firstName": "Alice",
        "lastName": "Martin",
        "email": "alice@example.com",
        "password": "securepass",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "alice@example.com"
    assert data["role"] == "STUDENT"
    assert "token" in data


def test_register_duplicate_email(client: TestClient, db: Session):
    create_user(db, "bob@example.com")
    response = client.post("/api/auth/register", json={
        "firstName": "Bob",
        "lastName": "Dupont",
        "email": "bob@example.com",
        "password": "securepass",
    })
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_register_short_password(client: TestClient):
    response = client.post("/api/auth/register", json={
        "firstName": "Carol",
        "lastName": "Test",
        "email": "carol@example.com",
        "password": "short",
    })
    assert response.status_code == 422  # Pydantic validation error


def test_login_success(client: TestClient, db: Session):
    create_user(db, "dave@example.com", password="mypassword")
    response = client.post("/api/auth/login", json={
        "email": "dave@example.com",
        "password": "mypassword",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "dave@example.com"
    assert "token" in data


def test_login_wrong_password(client: TestClient, db: Session):
    create_user(db, "eve@example.com", password="correctpass")
    response = client.post("/api/auth/login", json={
        "email": "eve@example.com",
        "password": "wrongpass",
    })
    assert response.status_code == 401


def test_login_unknown_email(client: TestClient):
    response = client.post("/api/auth/login", json={
        "email": "ghost@example.com",
        "password": "password123",
    })
    assert response.status_code == 401


def test_get_me_authenticated(client: TestClient, db: Session):
    user = create_user(db, "frank@example.com")
    response = client.get("/api/auth/me", headers=auth_headers(user))
    assert response.status_code == 200
    assert response.json()["email"] == "frank@example.com"


def test_get_me_unauthenticated(client: TestClient):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
