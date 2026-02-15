from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class Series(Base):
    __tablename__ = "series"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    difficulty = Column(String, nullable=False, default="MEDIUM")
    code = Column(String, unique=True, index=True, nullable=False)
    classroomId = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    createdById = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    classroom = relationship("Classroom", back_populates="series")
    created_by = relationship("User", back_populates="created_series")
    images = relationship("SeriesImage", back_populates="series", cascade="all, delete-orphan", order_by="SeriesImage.orderIndex")
    progress = relationship("SeriesProgress", back_populates="series", cascade="all, delete-orphan")


class SeriesImage(Base):
    __tablename__ = "series_images"

    id = Column(Integer, primary_key=True, index=True)
    seriesId = Column(Integer, ForeignKey("series.id", ondelete="CASCADE"), nullable=False)
    imageUrl = Column(String, nullable=False)
    orderIndex = Column(Integer, default=0, nullable=False)

    series = relationship("Series", back_populates="images")


class SeriesProgress(Base):
    __tablename__ = "series_progress"
    __table_args__ = (UniqueConstraint("userId", "seriesId", name="uq_user_series"),)

    id = Column(Integer, primary_key=True, index=True)
    userId = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    seriesId = Column(Integer, ForeignKey("series.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="NOT_STARTED", nullable=False)
    precision = Column(Float, nullable=True)
    score = Column(Integer, nullable=True)
    startedAt = Column(DateTime, nullable=True)
    completedAt = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="series_progress")
    series = relationship("Series", back_populates="progress")
