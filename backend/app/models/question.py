import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(20), default="mcq", nullable=False)  # mcq, true_false, short_answer
    options = Column(JSON, nullable=True)  # List of string options for MCQ
    correct_answer = Column(String(500), nullable=False)
    points = Column(Integer, default=1, nullable=False)
    explanation = Column(Text, nullable=True)

    exam = relationship("Exam", back_populates="questions")
