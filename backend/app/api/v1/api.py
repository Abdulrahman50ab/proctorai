from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.exams import router as exams_router
from app.api.v1.ai_questions import router as ai_questions_router
from app.api.v1.sessions import router as sessions_router
from app.api.v1.events import router as events_router
from app.api.v1.reports import router as reports_router
from app.api.v1.websocket import router as ws_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(ai_questions_router)
api_router.include_router(exams_router)
api_router.include_router(sessions_router)
api_router.include_router(events_router)
api_router.include_router(reports_router)
api_router.include_router(ws_router)
