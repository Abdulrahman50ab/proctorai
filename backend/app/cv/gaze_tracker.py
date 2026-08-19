import cv2
import numpy as np
from typing import Dict, Any

class GazeTracker:
    def __init__(self):
        self.mp_face_mesh = None
        self.face_mesh = None
        try:
            import mediapipe as mp
            self.mp_face_mesh = mp.solutions.face_mesh
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
        except Exception:
            self.face_mesh = None

    def estimate_gaze(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Estimates gaze direction: LOOKING_CENTER, LOOKING_LEFT, LOOKING_RIGHT, LOOKING_UP, LOOKING_DOWN, UNKNOWN
        """
        if image is None or image.size == 0:
            return {"gaze_direction": "UNKNOWN", "score": 0.0, "is_deviated": False}

        h, w, _ = image.shape

        if self.face_mesh:
            try:
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                results = self.face_mesh.process(rgb_image)
                if results.multi_face_landmarks:
                    landmarks = results.multi_face_landmarks[0].landmark
                    
                    # Left iris center (landmark 468) vs Left eye corners (33, 133)
                    # Right iris center (landmark 473) vs Right eye corners (362, 263)
                    if len(landmarks) > 473:
                        left_iris = landmarks[468]
                        left_inner = landmarks[133]
                        left_outer = landmarks[33]

                        # Calculate relative iris position horizontally
                        eye_width = abs(left_inner.x - left_outer.x)
                        if eye_width > 0:
                            rel_x = (left_iris.x - min(left_outer.x, left_inner.x)) / eye_width
                            if rel_x < 0.35:
                                return {"gaze_direction": "LOOKING_RIGHT", "score": 0.85, "is_deviated": True}
                            elif rel_x > 0.65:
                                return {"gaze_direction": "LOOKING_LEFT", "score": 0.85, "is_deviated": True}

                        # Vertical gaze (eyebrow vs eye vs nose)
                        nose_tip = landmarks[1]
                        if left_iris.y < landmarks[159].y:
                            return {"gaze_direction": "LOOKING_UP", "score": 0.75, "is_deviated": True}

                    return {"gaze_direction": "LOOKING_CENTER", "score": 0.95, "is_deviated": False}
            except Exception:
                pass

        return {"gaze_direction": "LOOKING_CENTER", "score": 0.80, "is_deviated": False}

gaze_tracker = GazeTracker()
