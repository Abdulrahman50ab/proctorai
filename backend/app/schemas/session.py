from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr
from app.schemas.exam import CandidateExamResponse
from app.schemas.event import EventResponse

class SessionCreate(BaseModel):
    exam_id: str
    candidate_name: str
    candidate_email: EmailStr

class SessionStart(BaseModel):
    reference_photo_base64: Optional[str] = None

class SessionSubmit(BaseModel):
    answers: Dict[str, str] = {}  # {question_id: selected_option}

class ResultResponse(BaseModel):
    id: str
    score: float
    total_questions: int
    correct_answers: int
    passed: bool
    submitted_at: datetime

    class Config:
        from_attributes = True

class SessionResponse(BaseModel):
    id: str
    exam_id: str
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    session_token: str
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    risk_score: int
    risk_level: str
    exam: Optional[CandidateExamResponse] = None
    result: Optional[ResultResponse] = None

    class Config:
        from_attributes = True
