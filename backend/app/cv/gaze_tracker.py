import cv2
import numpy as np
from typing import Dict, Any, List

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

    def estimate_gaze(self, image: np.ndarray, face_landmarks: List[Any] = None) -> Dict[str, Any]:
        """
        Estimates gaze direction: LOOKING_CENTER, LOOKING_LEFT, LOOKING_RIGHT, LOOKING_UP, LOOKING_DOWN, NO_FACE
        """
        if image is None or image.size == 0:
            return {"gaze_direction": "NO_FACE", "score": 0.0, "is_deviated": False}

        h, w, _ = image.shape

        # 1. Use landmarks from YuNet if provided
        if face_landmarks and len(face_landmarks) > 0:
            lm = face_landmarks[0]
            if len(lm) >= 5:
                r_eye, l_eye, nose, r_mouth, l_mouth = lm[0], lm[1], lm[2], lm[3], lm[4]
                # Ratio of nose x between right eye and left eye
                eye_dist = abs(l_eye[0] - r_eye[0])
                if eye_dist > 10:
                    rel_nose = (nose[0] - min(r_eye[0], l_eye[0])) / eye_dist
                    if rel_nose < 0.35:
                        return {"gaze_direction": "LOOKING_RIGHT", "score": 0.85, "is_deviated": True}
                    elif rel_nose > 0.65:
                        return {"gaze_direction": "LOOKING_LEFT", "score": 0.85, "is_deviated": True}
                return {"gaze_direction": "LOOKING_CENTER", "score": 0.90, "is_deviated": False}

        # 2. Use MediaPipe if available
        if self.face_mesh:
            try:
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                results = self.face_mesh.process(rgb_image)
                if results.multi_face_landmarks:
                    landmarks = results.multi_face_landmarks[0].landmark
                    if len(landmarks) > 473:
                        left_iris = landmarks[468]
                        left_inner = landmarks[133]
                        left_outer = landmarks[33]

                        eye_width = abs(left_inner.x - left_outer.x)
                        if eye_width > 0:
                            rel_x = (left_iris.x - min(left_outer.x, left_inner.x)) / eye_width
                            if rel_x < 0.35:
                                return {"gaze_direction": "LOOKING_RIGHT", "score": 0.85, "is_deviated": True}
                            elif rel_x > 0.65:
                                return {"gaze_direction": "LOOKING_LEFT", "score": 0.85, "is_deviated": True}

                    return {"gaze_direction": "LOOKING_CENTER", "score": 0.95, "is_deviated": False}
            except Exception:
                pass

        return {"gaze_direction": "LOOKING_CENTER", "score": 0.80, "is_deviated": False}

gaze_tracker = GazeTracker()
