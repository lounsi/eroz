from __future__ import annotations

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserStats(Base):
    __tablename__ = "user_stats"

    id = Column(Integer, primary_key=True, index=True)
    userId = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)

    totalXp = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    totalSessions = Column(Integer, default=0, nullable=False)
    averageScore = Column(Float, default=0, nullable=False)
    averageTime = Column(Integer, default=0, nullable=False)
    currentStreak = Column(Integer, default=0, nullable=False)
    lastActivityAt = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="stats")
