import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False)  # FACE_NOT_DETECTED, MULTIPLE_FACES_DETECTED, etc.
    confidence = Column(Float, default=1.0, nullable=False)
    risk_score_impact = Column(Integer, default=10, nullable=False)
    evidence_path = Column(String(500), nullable=True)  # Snapshot image file path / URL
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    session = relationship("Session", back_populates="events")
