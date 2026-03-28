from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.conftest import auth_headers, create_user


def test_list_users_as_admin(client: TestClient, db: Session):
    admin = create_user(db, "admin@example.com", role="ADMIN")
    create_user(db, "student@example.com", role="STUDENT")

    response = client.get("/api/users/", headers=auth_headers(admin))
    assert response.status_code == 200
    emails = [u["email"] for u in response.json()]
    assert "admin@example.com" in emails
    assert "student@example.com" in emails


def test_list_users_as_student_forbidden(client: TestClient, db: Session):
    student = create_user(db, "student2@example.com", role="STUDENT")
    response = client.get("/api/users/", headers=auth_headers(student))
    assert response.status_code == 403


def test_list_users_search(client: TestClient, db: Session):
    admin = create_user(db, "admin2@example.com", role="ADMIN", first="Admin", last="Eroz")
    create_user(db, "charlie@example.com", role="STUDENT", first="Charlie", last="Brown")
    create_user(db, "dana@example.com", role="STUDENT", first="Dana", last="White")

    response = client.get("/api/users/?search=Charlie", headers=auth_headers(admin))
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["firstName"] == "Charlie"


def test_update_role(client: TestClient, db: Session):
    admin = create_user(db, "admin3@example.com", role="ADMIN")
    target = create_user(db, "target@example.com", role="STUDENT")

    response = client.put(
        f"/api/users/{target.id}/role",
        json={"role": "PROF"},
        headers=auth_headers(admin),
    )
    assert response.status_code == 200
    assert response.json()["role"] == "PROF"


def test_update_role_invalid(client: TestClient, db: Session):
    admin = create_user(db, "admin4@example.com", role="ADMIN")
    target = create_user(db, "target2@example.com", role="STUDENT")

    response = client.put(
        f"/api/users/{target.id}/role",
        json={"role": "SUPERUSER"},
        headers=auth_headers(admin),
    )
    assert response.status_code == 400


def test_delete_user(client: TestClient, db: Session):
    admin = create_user(db, "admin5@example.com", role="ADMIN")
    target = create_user(db, "target3@example.com", role="STUDENT")

    response = client.delete(f"/api/users/{target.id}", headers=auth_headers(admin))
    assert response.status_code == 200

    # Confirm deletion
    from app.models import User
    assert db.get(User, target.id) is None


def test_delete_nonexistent_user(client: TestClient, db: Session):
    admin = create_user(db, "admin6@example.com", role="ADMIN")
    response = client.delete("/api/users/99999", headers=auth_headers(admin))
    assert response.status_code == 404
