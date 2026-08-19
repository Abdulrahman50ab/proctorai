from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from app.core.database import get_db
from app.models.session import Session
from app.models.report import Report
from app.models.event import Event
from app.schemas.report import ReportResponse
from app.proctoring.risk_engine import risk_engine

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/{session_id}", response_model=ReportResponse)
def get_session_report(session_id: str, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    report = db.query(Report).filter(Report.session_id == session_id).first()
    events = db.query(Event).filter(Event.session_id == session_id).order_by(Event.timestamp.asc()).all()

    # If report not generated yet, calculate live metrics
    if not report:
        metrics = risk_engine.compute_session_metrics(events)
        return {
            "id": "live-report",
            "session_id": session.id,
            "candidate_name": session.candidate_name,
            "candidate_email": session.candidate_email,
            "exam_title": session.exam.title if session.exam else "Assessment",
            "face_presence_percentage": metrics["face_presence_percentage"],
            "attention_percentage": metrics["attention_percentage"],
            "total_violations": metrics["total_violations"],
            "final_risk_score": metrics["final_risk_score"],
            "risk_level": metrics["risk_level"],
            "summary_metrics": metrics["summary_metrics"],
            "generated_at": session.started_at or session.events[0].timestamp if session.events else session.started_at,
            "result": session.result,
            "events": events
        }

    return {
        "id": report.id,
        "session_id": session.id,
        "candidate_name": session.candidate_name,
        "candidate_email": session.candidate_email,
        "exam_title": session.exam.title if session.exam else "Assessment",
        "face_presence_percentage": report.face_presence_percentage,
        "attention_percentage": report.attention_percentage,
        "total_violations": report.total_violations,
        "final_risk_score": report.final_risk_score,
        "risk_level": report.risk_level,
        "summary_metrics": report.summary_metrics,
        "generated_at": report.generated_at,
        "result": session.result,
        "events": events
    }

@router.get("/exam/{exam_id}")
def get_exam_all_reports(exam_id: str, db: DBSession = Depends(get_db)):
    sessions = db.query(Session).filter(Session.exam_id == exam_id).order_by(Session.started_at.desc()).all()
    results = []
    for s in sessions:
        report = s.report
        results.append({
            "session_id": s.id,
            "candidate_name": s.candidate_name,
            "candidate_email": s.candidate_email,
            "status": s.status,
            "score": s.result.score if s.result else None,
            "passed": s.result.passed if s.result else None,
            "risk_score": s.risk_score,
            "risk_level": s.risk_level,
            "violations_count": len(s.events),
            "face_presence": report.face_presence_percentage if report else None,
            "attention_score": report.attention_percentage if report else None,
            "started_at": s.started_at,
            "ended_at": s.ended_at
        })
    return results
