from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.question import QuestionCreate, QuestionResponse, CandidateQuestion

class ExamBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: int = 30
    proctoring_level: str = "standard"  # basic, standard, strict
    passing_score: int = 60

class ExamCreate(ExamBase):
    questions: Optional[List[QuestionCreate]] = []

class ExamUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    proctoring_level: Optional[str] = None
    passing_score: Optional[int] = None

class ExamResponse(ExamBase):
    id: str
    access_code: Optional[str] = None
    created_by: str
    created_at: datetime
    questions: List[QuestionResponse] = []

    class Config:
        from_attributes = True

# Candidate view of Exam (without answers)
class CandidateExamResponse(ExamBase):
    id: str
    access_code: Optional[str] = None
    questions: List[CandidateQuestion] = []

    class Config:
        from_attributes = True
