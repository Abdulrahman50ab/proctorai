import pytest
from app.proctoring.risk_engine import risk_engine
from app.proctoring.event_engine import event_engine
from app.models.event import Event
from datetime import datetime, timezone

def test_risk_level_categorization():
    assert risk_engine.calculate_risk_level(15) == "LOW"
    assert risk_engine.calculate_risk_level(20) == "LOW"
    assert risk_engine.calculate_risk_level(25) == "MEDIUM"
    assert risk_engine.calculate_risk_level(50) == "MEDIUM"
    assert risk_engine.calculate_risk_level(75) == "HIGH"

def test_event_weights():
    assert event_engine.get_event_impact("FACE_NOT_DETECTED") == 10
    assert event_engine.get_event_impact("MULTIPLE_FACES_DETECTED") == 30
    assert event_engine.get_event_impact("PHONE_DETECTED") == 40
    assert event_engine.get_event_impact("CAMERA_DISABLED") == 50

def test_compute_session_metrics():
    events = [
        Event(session_id="test-1", event_type="FACE_NOT_DETECTED", risk_score_impact=10, timestamp=datetime.now(timezone.utc)),
        Event(session_id="test-1", event_type="FACE_NOT_DETECTED", risk_score_impact=10, timestamp=datetime.now(timezone.utc)),
        Event(session_id="test-1", event_type="PHONE_DETECTED", risk_score_impact=40, timestamp=datetime.now(timezone.utc)),
    ]
    metrics = risk_engine.compute_session_metrics(events)
    assert metrics["final_risk_score"] == 60
    assert metrics["risk_level"] == "HIGH"
    assert metrics["total_violations"] == 3
    assert metrics["face_presence_percentage"] < 100.0
