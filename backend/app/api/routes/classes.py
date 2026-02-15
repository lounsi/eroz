from __future__ import annotations

import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_prof_or_admin
from app.core.database import get_db
from app.models import Classroom, Enrollment, User
from app.schemas.classroom import (
    ClassroomCreate,
    ClassroomDetailResponse,
    ClassroomResponse,
    ClassroomUpdate,
    EnrollmentStudentResponse,
    JoinByCodeRequest,
)

router = APIRouter(prefix="/classes", tags=["classes"])


def _generate_code() -> str:
    return secrets.token_urlsafe(6)[:8].upper()


# ── Student ──────────────────────────────────────────────────


@router.post("/join")
def join_class_by_code(
    payload: JoinByCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    classroom = db.query(Classroom).filter(Classroom.code == payload.code.strip().upper()).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid class code")

    existing = (
        db.query(Enrollment)
        .filter(Enrollment.userId == current_user.id, Enrollment.classroomId == classroom.id)
        .first()
    )
    if existing:
        return {"message": "Already enrolled", "classroomId": classroom.id, "classroomName": classroom.name}

    enrollment = Enrollment(
        userId=current_user.id,
        classroomId=classroom.id,
    )
    db.add(enrollment)
    db.commit()
    return {"message": "Enrolled successfully", "classroomId": classroom.id, "classroomName": classroom.name}


@router.get("/my", response_model=list[ClassroomResponse])
def get_student_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.userId == current_user.id)
        .all()
    )
    results = []
    for e in enrollments:
        c = e.classroom
        results.append(
            ClassroomResponse(
                id=c.id,
                name=c.name,
                description=c.description,
                code=c.code,
                ownerId=c.ownerId,
                createdAt=c.createdAt,
                studentCount=len(c.enrollments),
                seriesCount=len(c.series),
            )
        )
    return results


# ── Prof / Admin ─────────────────────────────────────────────


@router.get("/", response_model=list[ClassroomResponse])
def list_my_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_prof_or_admin),
):
    if current_user.role == "ADMIN":
        classrooms = (
            db.query(Classroom)
            .order_by(Classroom.createdAt.desc())
            .all()
        )
    else:
        classrooms = (
            db.query(Classroom)
            .filter(Classroom.ownerId == current_user.id)
            .order_by(Classroom.createdAt.desc())
            .all()
        )
    results = []
    for c in classrooms:
        results.append(
            ClassroomResponse(
                id=c.id,
                name=c.name,
                description=c.description,
                code=c.code,
                ownerId=c.ownerId,
                createdAt=c.createdAt,
                studentCount=len(c.enrollments),
                seriesCount=len(c.series),
            )
        )
    return results


@router.post("/", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    payload: ClassroomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_prof_or_admin),
):
    classroom = Classroom(
        name=payload.name,
        description=payload.description,
        code=_generate_code(),
        ownerId=current_user.id,
    )
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return ClassroomResponse(
        id=classroom.id,
        name=classroom.name,
        description=classroom.description,
        code=classroom.code,
        ownerId=classroom.ownerId,
        createdAt=classroom.createdAt,
        studentCount=0,
        seriesCount=0,
    )


@router.get("/{class_id}", response_model=ClassroomDetailResponse)
def get_class_detail(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    classroom = db.get(Classroom, class_id)
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    # Access Control
    if current_user.role == "ADMIN":
        pass  # Admin has full access
    elif current_user.role == "PROF":
        if classroom.ownerId != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your class")
    else:  # STUDENT
        is_enrolled = any(e.userId == current_user.id for e in classroom.enrollments)
        if not is_enrolled:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this class")

    students = [
        EnrollmentStudentResponse(
            id=e.user.id,
            firstName=e.user.firstName,
            lastName=e.user.lastName,
            email=e.user.email,
        )
        for e in classroom.enrollments
    ]

    return ClassroomDetailResponse(
        id=classroom.id,
        name=classroom.name,
        description=classroom.description,
        code=classroom.code,
        ownerId=classroom.ownerId,
        createdAt=classroom.createdAt,
        students=students,
    )


@router.put("/{class_id}", response_model=ClassroomResponse)
def update_class(
    class_id: int,
    payload: ClassroomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_prof_or_admin),
):
    classroom = db.get(Classroom, class_id)
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    if classroom.ownerId != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your class")

    if payload.name is not None:
        classroom.name = payload.name
    if payload.description is not None:
        classroom.description = payload.description

    db.commit()
    db.refresh(classroom)
    return ClassroomResponse(
        id=classroom.id,
        name=classroom.name,
        description=classroom.description,
        code=classroom.code,
        ownerId=classroom.ownerId,
        createdAt=classroom.createdAt,
        studentCount=len(classroom.enrollments),
        seriesCount=len(classroom.series),
    )


@router.delete("/{class_id}")
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_prof_or_admin),
):
    classroom = db.get(Classroom, class_id)
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    if classroom.ownerId != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your class")

    db.delete(classroom)
    db.commit()
    return {"message": "Class deleted"}



