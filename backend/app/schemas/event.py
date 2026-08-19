from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

class EventBase(BaseModel):
    event_type: str
    confidence: float = 1.0
    risk_score_impact: int = 10
    evidence_path: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class EventCreate(EventBase):
    session_id: str
    evidence_base64: Optional[str] = None  # Optional frame snapshot to save

class EventResponse(EventBase):
    id: str
    session_id: str
    timestamp: datetime

    class Config:
        from_attributes = True
