import os
import uuid
import base64
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from app.core.config import settings

# Event types and default risk score weights based on PRD
EVENT_WEIGHTS = {
    "FACE_NOT_DETECTED": 10,
    "MULTIPLE_FACES_DETECTED": 30,
    "PHONE_DETECTED": 40,
    "GAZE_DEVIATION": 10,
    "HEAD_POSE_ANOMALY": 15,
    "FULLSCREEN_EXITED": 15,
    "TAB_SWITCHED": 10,
    "WINDOW_BLURRED": 10,
    "COPY_ATTEMPTED": 5,
    "CAMERA_DISABLED": 50,
    "VOICE_DETECTED": 15,
}

class EventEngine:
    def __init__(self):
        self.weights = EVENT_WEIGHTS

    def get_event_impact(self, event_type: str) -> int:
        return self.weights.get(event_type, 10)

    def save_evidence_snapshot(self, base64_data: str, session_id: str, event_type: str) -> Optional[str]:
        """
        Saves a base64 frame snapshot to the evidence directory and returns the relative file path.
        """
        if not base64_data:
            return None

        try:
            if "," in base64_data:
                base64_data = base64_data.split(",")[1]

            img_bytes = base64.b64decode(base64_data)
            filename = f"evidence_{session_id[:8]}_{event_type.lower()}_{uuid.uuid4().hex[:6]}.jpg"
            filepath = os.path.join(settings.EVIDENCE_DIR, filename)

            with open(filepath, "wb") as f:
                f.write(img_bytes)

            # Return relative path for web access
            return f"/uploads/evidence/{filename}"
        except Exception as e:
            print(f"Error saving evidence: {e}")
            return None

event_engine = EventEngine()
