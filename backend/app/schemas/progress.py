from __future__ import annotations

from datetime import datetime
from typing import Dict

from pydantic import BaseModel, ConfigDict


class UserStatsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    userId: int
    totalXp: int
    level: int
    totalSessions: int
    averageScore: float
    averageTime: int
    currentStreak: int
    lastActivityAt: datetime | None


class TrainingSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    userId: int
    difficulty: str
    precision: float
    duration: int
    totalImages: int
    correctAnswers: int
    baseScore: int
    multiplier: float
    xpEarned: int
    completedAt: datetime


class WeeklyActivityResponse(BaseModel):
    activity: Dict[str, int]


class XpProgressResponse(BaseModel):
    level: int
    totalXp: int | None = None
    currentXp: int
    xpForNextLevel: int
    progress: int
