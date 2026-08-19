import cv2
import numpy as np
from typing import Dict, Any

class HeadPoseEstimator:
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

        # Standard 3D model points of a human face
        self.model_points = np.array([
            (0.0, 0.0, 0.0),             # Nose tip
            (0.0, -330.0, -65.0),        # Chin
            (-225.0, 170.0, -135.0),     # Left eye left corner
            (225.0, 170.0, -135.0),      # Right eye right corner
            (-150.0, -150.0, -125.0),    # Left mouth corner
            (150.0, -150.0, -125.0)      # Right mouth corner
        ])

    def estimate_pose(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Estimates head yaw, pitch, roll angles.
        Returns:
            {
                "pitch": float,
                "yaw": float,
                "roll": float,
                "direction": "CENTER" | "LEFT" | "RIGHT" | "UP" | "DOWN",
                "is_anomaly": bool
            }
        """
        if image is None or image.size == 0:
            return {"pitch": 0.0, "yaw": 0.0, "roll": 0.0, "direction": "CENTER", "is_anomaly": False}

        h, w, _ = image.shape

        if self.face_mesh:
            try:
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                results = self.face_mesh.process(rgb_image)
                if results.multi_face_landmarks:
                    landmarks = results.multi_face_landmarks[0].landmark
                    
                    # Corresponding 2D landmark indices in MediaPipe
                    # 1: Nose tip, 152: Chin, 33: Left eye outer, 263: Right eye outer, 61: Left mouth, 291: Right mouth
                    image_points = np.array([
                        (landmarks[1].x * w, landmarks[1].y * h),
                        (landmarks[152].x * w, landmarks[152].y * h),
                        (landmarks[33].x * w, landmarks[33].y * h),
                        (landmarks[263].x * w, landmarks[263].y * h),
                        (landmarks[61].x * w, landmarks[61].y * h),
                        (landmarks[291].x * w, landmarks[291].y * h)
                    ], dtype="double")

                    # Camera matrix approximation
                    focal_length = w
                    center = (w / 2, h / 2)
                    camera_matrix = np.array([
                        [focal_length, 0, center[0]],
                        [0, focal_length, center[1]],
                        [0, 0, 1]
                    ], dtype="double")
                    dist_coeffs = np.zeros((4, 1))

                    success, rotation_vector, translation_vector = cv2.solvePnP(
                        self.model_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
                    )

                    if success:
                        rotation_mat, _ = cv2.Rodrigues(rotation_vector)
                        pose_mat = cv2.hconcat((rotation_mat, translation_vector))
                        _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(pose_mat)

                        pitch, yaw, roll = [float(angle) for angle in euler_angles]

                        direction = "CENTER"
                        is_anomaly = False

                        if yaw > 25:
                            direction = "RIGHT"
                            is_anomaly = True
                        elif yaw < -25:
                            direction = "LEFT"
                            is_anomaly = True
                        elif pitch > 20:
                            direction = "DOWN"
                            is_anomaly = True
                        elif pitch < -20:
                            direction = "UP"
                            is_anomaly = True

                        return {
                            "pitch": round(pitch, 2),
                            "yaw": round(yaw, 2),
                            "roll": round(roll, 2),
                            "direction": direction,
                            "is_anomaly": is_anomaly
                        }
            except Exception:
                pass

        return {"pitch": 0.0, "yaw": 0.0, "roll": 0.0, "direction": "CENTER", "is_anomaly": False}

head_pose_estimator = HeadPoseEstimator()
