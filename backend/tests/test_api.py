import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ProctorAI" in data["service"]

def test_auth_and_exam_flow():
    # 1. Register Examiner
    reg_res = client.post("/api/auth/register", json={
        "name": "Prof Examiner",
        "email": "examiner@test.com",
        "password": "SecretPassword123!",
        "role": "examiner"
    })
    assert reg_res.status_code in [200, 400]  # 400 if already exists

    # 2. Login
    login_res = client.post("/api/auth/login", json={
        "email": "examiner@test.com",
        "password": "SecretPassword123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create Exam
    exam_res = client.post("/api/exams", headers=headers, json={
        "title": "Python & AI Assessment",
        "description": "Comprehensive evaluation of Python and AI basics.",
        "duration_minutes": 45,
        "proctoring_level": "standard",
        "passing_score": 70,
        "questions": [
            {
                "question_text": "Which data structure in Python is immutable?",
                "question_type": "mcq",
                "options": ["List", "Dictionary", "Tuple", "Set"],
                "correct_answer": "Tuple",
                "points": 1
            },
            {
                "question_text": "Is Python an interpreted language?",
                "question_type": "true_false",
                "options": ["True", "False"],
                "correct_answer": "True",
                "points": 1
            }
        ]
    })
    assert exam_res.status_code == 201
    exam_data = exam_res.json()
    exam_id = exam_data["id"]
    assert len(exam_data["questions"]) == 2

    # 4. Candidate registers/starts a session
    sess_res = client.post("/api/sessions", json={
        "exam_id": exam_id,
        "candidate_name": "Abdul Rahman",
        "candidate_email": "abdul@test.com"
    })
    assert sess_res.status_code == 201
    session_id = sess_res.json()["id"]

    # 5. Start Session
    start_res = client.post(f"/api/sessions/{session_id}/start")
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "in_progress"

    # 6. Submit Exam
    q1_id = exam_data["questions"][0]["id"]
    q2_id = exam_data["questions"][1]["id"]
    submit_res = client.post(f"/api/sessions/{session_id}/submit", json={
        "answers": {
            q1_id: "Tuple",
            q2_id: "True"
        }
    })
    assert submit_res.status_code == 200
    result_data = submit_res.json()
    assert result_data["score"] == 100.0
    assert result_data["passed"] is True

    # 7. Check Report
    rep_res = client.get(f"/api/reports/{session_id}")
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert rep_data["candidate_name"] == "Abdul Rahman"
    assert rep_data["risk_level"] == "LOW"
