from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClassroomCreate(BaseModel):
    name: str
    description: str | None = None


class ClassroomUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class JoinByCodeRequest(BaseModel):
    code: str


class ClassroomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    code: str
    ownerId: int
    createdAt: datetime
    studentCount: int = 0
    seriesCount: int = 0


class EnrollmentStudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    firstName: str
    lastName: str
    email: str


class ClassroomDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    code: str
    ownerId: int
    createdAt: datetime
    students: list[EnrollmentStudentResponse] = []
