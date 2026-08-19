from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from app.core.database import get_db
from app.models.session import Session
from app.models.report import Report
from app.models.event import Event
from app.proctoring.risk_engine import risk_engine

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


def _event_payload(ev: Event) -> Dict[str, Any]:
    return {
        "id": ev.id,
        "session_id": ev.session_id,
        "event_type": ev.event_type,
        "confidence": ev.confidence,
        "risk_score_impact": ev.risk_score_impact,
        "evidence_path": ev.evidence_path,
        "details": ev.details,
        "timestamp": ev.timestamp,
        "message": (ev.details or {}).get("message") if ev.details else None,
    }


def _build_report_payload(session: Session, report: Optional[Report], events: List[Event]) -> Dict[str, Any]:
    if report:
        metrics = report.summary_metrics or {}
        face_presence = report.face_presence_percentage
        attention = report.attention_percentage
        total_violations = report.total_violations
        risk_score = report.final_risk_score
        risk_level = report.risk_level
        generated_at = report.generated_at
        report_id = report.id
    else:
        metrics = risk_engine.compute_session_metrics(events)
        face_presence = metrics["face_presence_percentage"]
        attention = metrics["attention_percentage"]
        total_violations = metrics["total_violations"]
        risk_score = metrics["final_risk_score"]
        risk_level = metrics["risk_level"]
        generated_at = session.ended_at or session.started_at or datetime.now(timezone.utc)
        report_id = "live-report"
        metrics = metrics.get("summary_metrics", metrics)

    breakdown = {}
    if isinstance(metrics, dict):
        breakdown = metrics.get("event_breakdown") or metrics

    exam_title = session.exam.title if session.exam else "Assessment"
    status = "clean" if risk_score < 25 else ("flagged" if risk_score < 51 else "high_risk")

    result_payload = None
    if session.result:
        result_payload = {
            "id": session.result.id,
            "score": session.result.score,
            "total_questions": session.result.total_questions,
            "correct_answers": session.result.correct_answers,
            "passed": session.result.passed,
            "submitted_at": session.result.submitted_at,
        }

    event_list = [_event_payload(ev) for ev in events]

    return {
        "id": report_id,
        "session_id": session.id,
        "candidate_name": session.candidate_name,
        "candidate_email": session.candidate_email,
        "exam_title": exam_title,
        "face_presence_percentage": face_presence,
        "attention_percentage": attention,
        "attention_index": attention,
        "total_violations": total_violations,
        "final_risk_score": risk_score,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "summary_metrics": metrics,
        "violation_counts": {
            "total": total_violations,
            **(breakdown if isinstance(breakdown, dict) else {}),
        },
        "status": status,
        "generated_at": generated_at,
        "result": result_payload,
        "events": event_list,
        "session": {
            "id": session.id,
            "candidate_name": session.candidate_name,
            "candidate_email": session.candidate_email,
            "session_token": session.session_token,
            "status": session.status,
            "risk_score": session.risk_score,
            "risk_level": session.risk_level,
            "started_at": session.started_at,
            "ended_at": session.ended_at,
            "exam": {"title": exam_title, "id": session.exam_id},
            "result": result_payload,
            "events": event_list,
        },
    }


@router.get("")
def list_reports(db: DBSession = Depends(get_db)):
    reports = db.query(Report).order_by(Report.generated_at.desc()).all()
    payload = []
    for report in reports:
        session = report.session
        if not session:
            continue
        events = session.events or []
        payload.append(_build_report_payload(session, report, events))
    return payload


@router.get("/session/{session_id}")
def get_report_by_session(session_id: str, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    events = db.query(Event).filter(Event.session_id == session_id).order_by(Event.timestamp.asc()).all()
    report = db.query(Report).filter(Report.session_id == session_id).first()
    return _build_report_payload(session, report, events)


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
            "violations_count": len(s.events or []),
            "face_presence": report.face_presence_percentage if report else None,
            "attention_score": report.attention_percentage if report else None,
            "started_at": s.started_at,
            "ended_at": s.ended_at,
        })
    return results


@router.get("/{report_or_session_id}")
def get_report(report_or_session_id: str, db: DBSession = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_or_session_id).first()
    session = None
    if report:
        session = report.session
    if not session:
        session = db.query(Session).filter(Session.id == report_or_session_id).first()
        if session:
            report = db.query(Report).filter(Report.session_id == session.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Report not found")
    events = db.query(Event).filter(Event.session_id == session.id).order_by(Event.timestamp.asc()).all()
    return _build_report_payload(session, report, events)
