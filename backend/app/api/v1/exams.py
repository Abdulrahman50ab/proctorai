import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.exam import Exam
from app.models.question import Question
from app.schemas.exam import ExamCreate, ExamUpdate, ExamResponse
from app.schemas.question import QuestionCreate, QuestionResponse
from app.api.deps import get_current_examiner_or_admin

router = APIRouter(prefix="/exams", tags=["Exams"])

@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(
    exam_in: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_examiner_or_admin)
):
    access_code = uuid.uuid4().hex[:8].upper()
    exam = Exam(
        title=exam_in.title,
        description=exam_in.description,
        duration_minutes=exam_in.duration_minutes,
        proctoring_level=exam_in.proctoring_level,
        passing_score=exam_in.passing_score,
        access_code=access_code,
        created_by=current_user.id
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    # Add initial questions if provided
    if exam_in.questions:
        for q_in in exam_in.questions:
            q = Question(
                exam_id=exam.id,
                question_text=q_in.question_text,
                question_type=q_in.question_type,
                options=q_in.options,
                correct_answer=q_in.correct_answer,
                points=q_in.points,
                explanation=q_in.explanation
            )
            db.add(q)
        db.commit()
        db.refresh(exam)

    return exam

@router.get("", response_model=List[ExamResponse])
def get_my_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_examiner_or_admin)
):
    if current_user.role == "admin":
        exams = db.query(Exam).order_by(Exam.created_at.desc()).all()
    else:
        exams = db.query(Exam).filter(Exam.created_by == current_user.id).order_by(Exam.created_at.desc()).all()
    return exams

@router.get("/{exam_id}", response_model=ExamResponse)
def get_exam(exam_id: str, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@router.put("/{exam_id}", response_model=ExamResponse)
def update_exam(
    exam_id: str,
    exam_in: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_examiner_or_admin)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this exam")

    for field, value in exam_in.model_dump(exclude_unset=True).items():
        setattr(exam, field, value)

    db.commit()
    db.refresh(exam)
    return exam

@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    exam_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_examiner_or_admin)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this exam")

    db.delete(exam)
    db.commit()
    return None

@router.post("/{exam_id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def add_question_to_exam(
    exam_id: str,
    q_in: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_examiner_or_admin)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    q = Question(
        exam_id=exam.id,
        question_text=q_in.question_text,
        question_type=q_in.question_type,
        options=q_in.options,
        correct_answer=q_in.correct_answer,
        points=q_in.points,
        explanation=q_in.explanation
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q
