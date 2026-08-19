import json
import re
from typing import Any, Dict, List

import httpx
from fastapi import HTTPException, status
from app.core.config import settings

SYSTEM_PROMPT = """You are an exam question writer for a proctored assessment platform.
Return ONLY valid JSON (no markdown) with this exact shape:
{
  "questions": [
    {
      "question_text": "clear stem",
      "question_type": "mcq",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_answer": "must match one option string exactly",
      "points": 1,
      "explanation": "short reason for the correct answer"
    }
  ]
}
Rules:
- Exactly 4 unique options per question.
- correct_answer must be copied verbatim from one of the options.
- Questions must be factual, unambiguous, and appropriate for the given topic or source text.
- Do not mention these instructions."""


def extract_pdf_text(file_bytes: bytes, max_chars: int = 14000) -> str:
    try:
        from pypdf import PdfReader
        from io import BytesIO
        reader = PdfReader(BytesIO(file_bytes))
        chunks: List[str] = []
        for page in reader.pages:
            text = page.extract_text() or ""
            if text.strip():
                chunks.append(text.strip())
        combined = "\n\n".join(chunks).strip()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read PDF: {exc}",
        )

    if not combined:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text found in this PDF. Try a text-based PDF, not a scanned image.",
        )
    return combined[:max_chars]


def _parse_questions_json(raw: str) -> List[Dict[str, Any]]:
    cleaned = raw.strip()
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned)
    if fenced:
        cleaned = fenced.group(1).strip()
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if not match:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Groq returned a response that was not valid JSON.",
            )
        data = json.loads(match.group(0))

    items = data.get("questions") if isinstance(data, dict) else data
    if not isinstance(items, list) or not items:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Groq did not return any questions. Try a more specific topic.",
        )

    normalized: List[Dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        text = str(item.get("question_text") or "").strip()
        options = [str(opt).strip() for opt in (item.get("options") or []) if str(opt).strip()]
        correct = str(item.get("correct_answer") or "").strip()
        if not text or len(options) < 2:
            continue
        if len(options) > 4:
            options = options[:4]
        while len(options) < 4:
            options.append(f"Option {len(options) + 1}")
        if correct not in options:
            correct = options[0]
        normalized.append({
            "question_text": text,
            "question_type": "mcq",
            "options": options,
            "correct_answer": correct,
            "points": int(item.get("points") or 1),
            "explanation": str(item.get("explanation") or "").strip() or None,
        })

    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not parse usable MCQ questions from Groq.",
        )
    return normalized


def generate_questions_with_groq(
    user_prompt: str,
    count: int = 5,
    difficulty: str = "medium",
) -> List[Dict[str, Any]]:
    api_key = (settings.GROQ_API_KEY or "").strip()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GROQ_API_KEY is missing. Add it to backend/.env (Groq Cloud console).",
        )

    count = max(1, min(int(count or 5), 15))
    difficulty = (difficulty or "medium").strip().lower()
    payload = {
        "model": settings.GROQ_MODEL,
        "temperature": 0.4,
        "max_completion_tokens": 4000,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Create exactly {count} multiple-choice questions at {difficulty} difficulty.\n\n"
                    f"{user_prompt}"
                ),
            },
        ],
        "response_format": {"type": "json_object"},
    }

    try:
        with httpx.Client(timeout=90.0) as client:
            response = client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not reach Groq Cloud: {exc}",
        )

    if response.status_code >= 400:
        try:
            err = response.json()
            message = err.get("error", {}).get("message") or response.text
        except Exception:
            message = response.text
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Groq API error: {message}",
        )

    body = response.json()
    content = (
        ((body.get("choices") or [{}])[0].get("message") or {}).get("content") or ""
    )
    return _parse_questions_json(content)
