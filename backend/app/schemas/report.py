from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from app.schemas.event import EventResponse
from app.schemas.session import ResultResponse

class ReportResponse(BaseModel):
    id: str
    session_id: str
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    exam_title: Optional[str] = None
    face_presence_percentage: float
    attention_percentage: float
    total_violations: int
    final_risk_score: int
    risk_level: str
    summary_metrics: Optional[Dict[str, Any]] = None
    generated_at: datetime
    result: Optional[ResultResponse] = None
    events: List[EventResponse] = []

    class Config:
        from_attributes = True
