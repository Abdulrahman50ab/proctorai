from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from app.api.deps import get_current_examiner_or_admin
from app.models.user import User
from app.services.groq_questions import extract_pdf_text, generate_questions_with_groq

router = APIRouter(prefix="/exams", tags=["AI Question Generation"])


class TopicGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=2000)
    count: int = Field(5, ge=1, le=15)
    difficulty: str = Field("medium")


@router.post("/generate-from-topic")
def generate_from_topic(
    body: TopicGenerateRequest,
    current_user: User = Depends(get_current_examiner_or_admin),
):
    questions = generate_questions_with_groq(
        user_prompt=f"Topic / syllabus:\n{body.topic.strip()}",
        count=body.count,
        difficulty=body.difficulty,
    )
    return {"source": "topic", "count": len(questions), "questions": questions}


@router.post("/generate-from-pdf")
async def generate_from_pdf(
    file: UploadFile = File(...),
    count: int = Form(8),
    difficulty: str = Form("medium"),
    current_user: User = Depends(get_current_examiner_or_admin),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please upload a PDF file.")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded PDF is empty.")
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PDF must be 10 MB or smaller.")

    pdf_text = extract_pdf_text(data)
    questions = generate_questions_with_groq(
        user_prompt=(
            "Create exam questions strictly from this PDF content. "
            "Do not invent facts that are not supported by the text.\n\n"
            f"PDF content:\n{pdf_text}"
        ),
        count=count,
        difficulty=difficulty,
    )
    return {
        "source": "pdf",
        "filename": file.filename,
        "count": len(questions),
        "questions": questions,
    }
