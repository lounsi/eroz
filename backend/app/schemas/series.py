from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SeriesCreate(BaseModel):
    title: str
    description: str | None = None
    difficulty: str = "MEDIUM"
    classroomId: int
    imageUrls: list[str] = []


class SeriesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    difficulty: str
    code: str
    classroomId: int
    createdById: int
    createdAt: datetime
    imageCount: int = 0
    status: str | None = None


class SeriesImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    imageUrl: str
    orderIndex: int


class SeriesDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    difficulty: str
    code: str
    classroomId: int
    createdById: int
    createdAt: datetime
    images: list[SeriesImageResponse] = []
    status: str | None = None
    score: int | None = None
    precision: float | None = None


class StudentSeriesProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    studentId: int
    firstName: str
    lastName: str
    status: str
    precision: float | None
    score: int | None
    completedAt: datetime | None


class SubmitSeriesResultRequest(BaseModel):
    precision: float
    score: int
    duration: int = 0
    totalImages: int = 0
    correctAnswers: int = 0
