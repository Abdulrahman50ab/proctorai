import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    candidate_name = Column(String(100), nullable=True)
    candidate_email = Column(String(150), nullable=True)
    session_token = Column(String(64), unique=True, index=True, nullable=False, default=lambda: uuid.uuid4().hex)
    status = Column(String(20), default="pending", nullable=False)  # pending, in_progress, completed, terminated
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    risk_score = Column(Integer, default=0, nullable=False)
    risk_level = Column(String(20), default="LOW", nullable=False)  # LOW, MEDIUM, HIGH

    exam = relationship("Exam", back_populates="sessions")
    candidate = relationship("User")
    events = relationship("Event", back_populates="session", cascade="all, delete-orphan")
    result = relationship("Result", back_populates="session", uselist=False, cascade="all, delete-orphan")
    report = relationship("Report", back_populates="session", uselist=False, cascade="all, delete-orphan")
