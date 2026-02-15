from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    code = Column(String, unique=True, index=True, nullable=False)
    ownerId = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="owned_classrooms")
    enrollments = relationship("Enrollment", back_populates="classroom", cascade="all, delete-orphan")
    series = relationship("Series", back_populates="classroom", cascade="all, delete-orphan")


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("userId", "classroomId", name="uq_user_classroom"),)

    id = Column(Integer, primary_key=True, index=True)
    userId = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    classroomId = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    joinedAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="enrollments")
    classroom = relationship("Classroom", back_populates="enrollments")
