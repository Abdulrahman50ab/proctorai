import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Exam(Base):
    __tablename__ = "exams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=30, nullable=False)
    proctoring_level = Column(String(20), default="standard", nullable=False)  # basic, standard, strict
    passing_score = Column(Integer, default=60, nullable=False)
    access_code = Column(String(20), unique=True, index=True, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    questions = relationship("Question", back_populates="exam", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="exam", cascade="all, delete-orphan")
