from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession
from app.core.database import get_db
from app.models.event import Event
from app.models.session import Session
from app.schemas.event import EventCreate, EventResponse
from app.proctoring.event_engine import event_engine
from app.proctoring.risk_engine import risk_engine

router = APIRouter(prefix="/sessions/{session_id}/events", tags=["Events"])

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def log_event(
    session_id: str,
    event_in: EventCreate,
    db: DBSession = Depends(get_db)
):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    evidence_path = None
    if event_in.evidence_base64:
        evidence_path = event_engine.save_evidence_snapshot(
            event_in.evidence_base64, session_id, event_in.event_type
        )
    elif event_in.evidence_path:
        evidence_path = event_in.evidence_path

    impact = event_engine.get_event_impact(event_in.event_type)

    event = Event(
        session_id=session.id,
        event_type=event_in.event_type,
        confidence=event_in.confidence,
        risk_score_impact=impact,
        evidence_path=evidence_path,
        details=event_in.details,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(event)

    # Update Session Risk Score
    session.risk_score = min(100, session.risk_score + impact)
    session.risk_level = risk_engine.calculate_risk_level(session.risk_score)

    db.commit()
    db.refresh(event)
    return event

@router.get("", response_model=List[EventResponse])
def get_session_events(session_id: str, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    events = db.query(Event).filter(Event.session_id == session_id).order_by(Event.timestamp.desc()).all()
    return events
