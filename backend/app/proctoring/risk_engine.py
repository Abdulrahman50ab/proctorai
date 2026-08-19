from typing import List, Dict, Any, Tuple
from app.models.event import Event

class RiskEngine:
    @staticmethod
    def calculate_risk_level(risk_score: int) -> str:
        """
        Risk classification according to PRD:
        0 - 20: LOW RISK
        21 - 50: MEDIUM RISK
        51+: HIGH RISK
        """
        if risk_score <= 20:
            return "LOW"
        elif risk_score <= 50:
            return "MEDIUM"
        else:
            return "HIGH"

    @staticmethod
    def compute_session_metrics(events: List[Event], total_duration_seconds: int = 1800) -> Dict[str, Any]:
        """
        Computes summary metrics, face presence percentage, attention score, and final risk score.
        """
        total_risk_score = 0
        event_counts: Dict[str, int] = {}
        missing_face_events = 0
        gaze_events = 0
        phone_events = 0
        multiple_face_events = 0

        for ev in events:
            total_risk_score += ev.risk_score_impact
            event_counts[ev.event_type] = event_counts.get(ev.event_type, 0) + 1

            if ev.event_type == "FACE_NOT_DETECTED":
                missing_face_events += 1
            elif ev.event_type in ["GAZE_DEVIATION", "HEAD_POSE_ANOMALY"]:
                gaze_events += 1
            elif ev.event_type == "PHONE_DETECTED":
                phone_events += 1
            elif ev.event_type == "MULTIPLE_FACES_DETECTED":
                multiple_face_events += 1

        # Calculate estimated face presence and attention percentages
        # Assuming each missing face event represents an estimated absence window
        face_presence = max(0.0, min(100.0, 100.0 - (missing_face_events * 3.5)))
        attention = max(0.0, min(100.0, 100.0 - (gaze_events * 2.5)))

        return {
            "final_risk_score": min(100, total_risk_score),
            "risk_level": RiskEngine.calculate_risk_level(total_risk_score),
            "total_violations": len(events),
            "face_presence_percentage": round(face_presence, 1),
            "attention_percentage": round(attention, 1),
            "summary_metrics": {
                "event_breakdown": event_counts,
                "missing_face_count": missing_face_events,
                "gaze_deviation_count": gaze_events,
                "phone_detection_count": phone_events,
                "multiple_faces_count": multiple_face_events
            }
        }

risk_engine = RiskEngine()
