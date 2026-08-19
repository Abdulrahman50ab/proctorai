from datetime import datetime, timezone
from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession
from app.core.database import get_db
from app.models.exam import Exam
from app.models.question import Question
from app.models.session import Session
from app.models.result import Result
from app.models.report import Report
from app.models.event import Event
from app.schemas.session import SessionCreate, SessionStart, SessionSubmit, SessionResponse, ResultResponse
from app.proctoring.session_monitor import session_monitor
from app.proctoring.risk_engine import risk_engine

router = APIRouter(prefix="/sessions", tags=["Sessions & Proctoring"])

class FrameProcessRequest(BaseModel):
    frame_base64: str

@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(session_in: SessionCreate, db: DBSession = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == session_in.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    session = Session(
        exam_id=exam.id,
        candidate_name=session_in.candidate_name,
        candidate_email=session_in.candidate_email.lower(),
        status="pending"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/{session_id}/start", response_model=SessionResponse)
def start_session(session_id: str, start_data: Optional[SessionStart] = None, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status == "completed":
        raise HTTPException(status_code=400, detail="This exam session has already been completed.")

    session.status = "in_progress"
    session.started_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return session

@router.post("/{session_id}/submit", response_model=ResultResponse)
def submit_session(session_id: str, submit_data: SessionSubmit, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status == "completed":
        # Return existing result
        if session.result:
            return session.result

    session.status = "completed"
    session.ended_at = datetime.now(timezone.utc)

    # 1. Compute Exam Score
    questions = db.query(Question).filter(Question.exam_id == session.exam_id).all()
    total_questions = len(questions)
    total_points = sum(q.points for q in questions) or 1
    earned_points = 0
    correct_count = 0

    for q in questions:
        candidate_ans = submit_data.answers.get(q.id)
        if candidate_ans and str(candidate_ans).strip().lower() == str(q.correct_answer).strip().lower():
            earned_points += q.points
            correct_count += 1

    percentage_score = round((earned_points / total_points) * 100, 2)
    passed = percentage_score >= session.exam.passing_score

    # Save Result
    result = Result(
        session_id=session.id,
        answers=submit_data.answers,
        score=percentage_score,
        total_questions=total_questions,
        correct_answers=correct_count,
        passed=passed,
        submitted_at=session.ended_at
    )
    db.add(result)

    # 2. Compute Proctoring Report
    events = db.query(Event).filter(Event.session_id == session.id).all()
    metrics = risk_engine.compute_session_metrics(events)

    report = Report(
        session_id=session.id,
        face_presence_percentage=metrics["face_presence_percentage"],
        attention_percentage=metrics["attention_percentage"],
        total_violations=metrics["total_violations"],
        final_risk_score=metrics["final_risk_score"],
        risk_level=metrics["risk_level"],
        summary_metrics=metrics["summary_metrics"],
        generated_at=session.ended_at
    )
    db.add(report)

    db.commit()
    db.refresh(result)
    return result

@router.post("/{session_id}/process-frame")
def process_frame(
    session_id: str,
    req: FrameProcessRequest,
    db: DBSession = Depends(get_db)
):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    proctoring_level = session.exam.proctoring_level if session.exam else "standard"
    result = session_monitor.process_frame(
        db=db,
        session_id=session_id,
        base64_frame=req.frame_base64,
        proctoring_level=proctoring_level
    )
    return result
