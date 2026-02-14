from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class TrainingSession(Base):
    __tablename__ = "training_sessions"

    id = Column(Integer, primary_key=True, index=True)
    userId = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    difficulty = Column(String, nullable=False)
    precision = Column(Float, nullable=False)
    duration = Column(Integer, nullable=False)
    totalImages = Column(Integer, nullable=False)
    correctAnswers = Column(Integer, nullable=False)
    baseScore = Column(Integer, nullable=False)
    multiplier = Column(Float, nullable=False)
    xpEarned = Column(Integer, nullable=False)
    completedAt = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    user = relationship("User", back_populates="sessions")
