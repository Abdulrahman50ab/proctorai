import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    face_presence_percentage = Column(Float, default=100.0, nullable=False)
    attention_percentage = Column(Float, default=100.0, nullable=False)
    total_violations = Column(Integer, default=0, nullable=False)
    final_risk_score = Column(Integer, default=0, nullable=False)
    risk_level = Column(String(20), default="LOW", nullable=False)
    summary_metrics = Column(JSON, nullable=True)  # breakdown of counts per event type
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    session = relationship("Session", back_populates="report")
