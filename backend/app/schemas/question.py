from typing import List, Optional
from pydantic import BaseModel

class QuestionBase(BaseModel):
    question_text: str
    question_type: str = "mcq"  # mcq, true_false, short_answer
    options: Optional[List[str]] = None
    correct_answer: str
    points: int = 1
    explanation: Optional[str] = None

class QuestionCreate(QuestionBase):
    pass

class QuestionResponse(QuestionBase):
    id: str
    exam_id: str

    class Config:
        from_attributes = True

# Question schema when presenting to candidate (correct_answer hidden)
class CandidateQuestion(BaseModel):
    id: str
    question_text: str
    question_type: str
    options: Optional[List[str]] = None
    points: int

    class Config:
        from_attributes = True
