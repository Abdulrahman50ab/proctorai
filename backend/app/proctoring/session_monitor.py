import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session as DBSession
from app.cv.face_detector import face_detector
from app.cv.gaze_tracker import gaze_tracker
from app.cv.head_pose import head_pose_estimator
from app.cv.object_detector import object_detector
from app.proctoring.event_engine import event_engine
from app.proctoring.risk_engine import risk_engine
from app.models.event import Event
from app.models.session import Session

class SessionMonitor:
    def __init__(self):
        self.session_states: Dict[str, Dict[str, Any]] = {}

    def _get_state(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self.session_states:
            self.session_states[session_id] = {
                "last_events": {},
                "missing_face_streak": 0,
                "gaze_streak": 0,
                "current_risk": 0,
                "frame_index": 0,
            }
        return self.session_states[session_id]

    def process_frame(
        self,
        db: DBSession,
        session_id: str,
        base64_frame: str,
        proctoring_level: str = "standard"
    ) -> Dict[str, Any]:
        """
        Analyzes a live frame, updates session state, logs events if thresholds are exceeded,
        and returns current status payload for WebSocket / Live Proctoring.
        """
        state = self._get_state(session_id)
        now = time.time()

        # 1. Decode image
        try:
            image = face_detector.decode_image(base64_frame)
        except Exception as e:
            return {"error": "Invalid frame format", "status": "error"}

        if image is None:
            return {"error": "Could not decode frame", "status": "error"}

        # 2. Run Face Detection
        try:
            face_res = face_detector.detect_faces(image)
        except Exception as e:
            print(f"[SessionMonitor] Face detection failed: {e}")
            face_res = {
                "face_detected": False,
                "face_count": 0,
                "faces": [],
                "centered": False,
                "lighting_score": 0,
                "landmarks": [],
            }
        face_detected = face_res["face_detected"]
        face_count = face_res["face_count"]

        new_events: List[Dict[str, Any]] = []

        state["frame_index"] = int(state.get("frame_index", 0)) + 1

        # 3. Check Face Missing (need a short streak so one miss doesn't spam alerts)
        if not face_detected:
            state["missing_face_streak"] += 1
            last_time = state["last_events"].get("FACE_NOT_DETECTED", 0)
            if state["missing_face_streak"] >= 2 and (now - last_time) > 4.0:
                evidence = event_engine.save_evidence_snapshot(base64_frame, session_id, "FACE_NOT_DETECTED")
                self._record_event(db, session_id, "FACE_NOT_DETECTED", 0.95, evidence)
                state["last_events"]["FACE_NOT_DETECTED"] = now
                new_events.append({"event_type": "FACE_NOT_DETECTED", "message": "Candidate face not visible in camera frame"})
        else:
            state["missing_face_streak"] = 0

        # 4. Check Multiple Faces
        if face_count > 1:
            last_time = state["last_events"].get("MULTIPLE_FACES_DETECTED", 0)
            if (now - last_time) > 5.0:
                evidence = event_engine.save_evidence_snapshot(base64_frame, session_id, "MULTIPLE_FACES_DETECTED")
                self._record_event(db, session_id, "MULTIPLE_FACES_DETECTED", 0.90, evidence, {"face_count": face_count})
                state["last_events"]["MULTIPLE_FACES_DETECTED"] = now
                new_events.append({"event_type": "MULTIPLE_FACES_DETECTED", "message": f"{face_count} faces detected in camera frame"})

        # 5. Check Gaze & Head Pose (if standard or strict)
        gaze_res = {"gaze_direction": "LOOKING_CENTER" if face_detected else "NO_FACE", "is_deviated": False}
        head_res = {"direction": "CENTER" if face_detected else "UNKNOWN", "is_anomaly": False}

        if proctoring_level in ["standard", "strict"] and face_detected:
            try:
                gaze_res = gaze_tracker.estimate_gaze(image, face_res.get("landmarks", []))
            except Exception:
                pass
            try:
                head_res = head_pose_estimator.estimate_pose(image)
            except Exception:
                pass

            if gaze_res["is_deviated"] or head_res["is_anomaly"]:
                state["gaze_streak"] += 1
                last_time = state["last_events"].get("GAZE_DEVIATION", 0)
                if state["gaze_streak"] >= 2 and (now - last_time) > 6.0:
                    event_type = "HEAD_POSE_ANOMALY" if head_res["is_anomaly"] else "GAZE_DEVIATION"
                    evidence = event_engine.save_evidence_snapshot(base64_frame, session_id, event_type)
                    self._record_event(db, session_id, event_type, 0.85, evidence, {
                        "gaze": gaze_res["gaze_direction"],
                        "head_pose": head_res["direction"]
                    })
                    state["last_events"]["GAZE_DEVIATION"] = now
                    new_events.append({"event_type": event_type, "message": f"Attention deviation: {gaze_res['gaze_direction']}"})
            else:
                state["gaze_streak"] = 0

        # 6. Check prohibited objects every 3rd frame so face detection stays responsive
        obj_res = {"prohibited_detected": False, "detected_objects": []}
        if proctoring_level in ["standard", "strict"] and face_detected and state["frame_index"] % 3 == 0:
            try:
                obj_res = object_detector.detect_objects(image)
            except Exception:
                obj_res = {"prohibited_detected": False, "detected_objects": []}
            if obj_res["prohibited_detected"]:
                last_time = state["last_events"].get("PHONE_DETECTED", 0)
                if (now - last_time) > 7.0:
                    evidence = event_engine.save_evidence_snapshot(base64_frame, session_id, "PHONE_DETECTED")
                    self._record_event(db, session_id, "PHONE_DETECTED", 0.90, evidence, {"objects": obj_res["detected_objects"]})
                    state["last_events"]["PHONE_DETECTED"] = now
                    new_events.append({"event_type": "PHONE_DETECTED", "message": "Prohibited item / mobile phone detected"})

        # Retrieve updated session risk
        session = db.query(Session).filter(Session.id == session_id).first()
        current_risk = session.risk_score if session else 0
        current_level = session.risk_level if session else "LOW"

        return {
            "status": "active",
            "face_detected": face_detected,
            "face_count": face_count,
            "faces": face_res.get("faces", []),
            "centered": face_res.get("centered", False),
            "lighting_score": face_res.get("lighting_score", 0),
            "gaze_direction": gaze_res.get("gaze_direction", "NO_FACE"),
            "head_pose": head_res.get("direction", "UNKNOWN"),
            "prohibited_detected": obj_res.get("prohibited_detected", False),
            "risk_score": current_risk,
            "risk_level": current_level,
            "auto_submit": current_risk >= 100,
            "new_events": new_events,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    def _record_event(
        self,
        db: DBSession,
        session_id: str,
        event_type: str,
        confidence: float,
        evidence_path: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        impact = event_engine.get_event_impact(event_type)
        ev = Event(
            session_id=session_id,
            event_type=event_type,
            confidence=confidence,
            risk_score_impact=impact,
            evidence_path=evidence_path,
            details=details,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(ev)

        # Update Session risk score and level
        session = db.query(Session).filter(Session.id == session_id).first()
        if session:
            session.risk_score = min(100, session.risk_score + impact)
            session.risk_level = risk_engine.calculate_risk_level(session.risk_score)
        db.commit()

session_monitor = SessionMonitor()
