import cv2
import numpy as np
import base64
from typing import Dict, Any, List, Tuple

class FaceDetector:
    def __init__(self):
        # Load OpenCV Haar cascade face detector as standard fallback
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.py' if hasattr(cv2, 'data') else 'haarcascade_frontalface_default.xml')
        if not self.face_cascade.empty():
            pass
        else:
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

        # Try to initialize MediaPipe Face Detection if available
        self.mp_face_detection = None
        self.mp_detector = None
        try:
            import mediapipe as mp
            self.mp_face_detection = mp.solutions.face_detection
            self.mp_detector = self.mp_face_detection.FaceDetection(
                model_selection=0, min_detection_confidence=0.5
            )
        except Exception:
            self.mp_detector = None

    def decode_image(self, base64_str: str) -> np.ndarray:
        """Decodes a base64 JPEG/PNG string into an OpenCV BGR image"""
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img

    def detect_faces(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Analyzes an image frame for face presence and count.
        Returns:
            {
                "face_detected": bool,
                "face_count": int,
                "faces": List of [x, y, w, h],
                "centered": bool,
                "lighting_score": float
            }
        """
        if image is None or image.size == 0:
            return {
                "face_detected": False,
                "face_count": 0,
                "faces": [],
                "centered": False,
                "lighting_score": 0.0
            }

        h, w, _ = image.shape
        faces_boxes = []

        # Use MediaPipe if available
        if self.mp_detector:
            try:
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                results = self.mp_detector.process(rgb_image)
                if results.detections:
                    for detection in results.detections:
                        bbox = detection.location_data.relative_bounding_box
                        xmin = int(bbox.xmin * w)
                        ymin = int(bbox.ymin * h)
                        box_w = int(bbox.width * w)
                        box_h = int(bbox.height * h)
                        faces_boxes.append([xmin, ymin, box_w, box_h])
            except Exception:
                faces_boxes = []

        # Fallback to OpenCV Haar Cascade if MediaPipe found nothing or is not active
        if not faces_boxes:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            detected = self.face_cascade.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
            )
            for (x, y, fw, fh) in detected:
                faces_boxes.append([int(x), int(y), int(fw), int(fh)])

        face_count = len(faces_boxes)
        face_detected = face_count > 0

        # Check if the primary face is centered in the frame
        is_centered = False
        if face_detected:
            fx, fy, fw, fh = faces_boxes[0]
            face_center_x = fx + fw / 2
            face_center_y = fy + fh / 2
            frame_center_x = w / 2
            frame_center_y = h / 2

            # Tolerance: within 30% of frame center
            x_diff = abs(face_center_x - frame_center_x) / w
            y_diff = abs(face_center_y - frame_center_y) / h
            if x_diff < 0.25 and y_diff < 0.25:
                is_centered = True

        # Calculate lighting score (average brightness in grayscale)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))
        # Normal lighting is roughly between 60 and 200
        lighting_score = min(100.0, max(0.0, (brightness / 255.0) * 100))

        return {
            "face_detected": face_detected,
            "face_count": face_count,
            "faces": faces_boxes,
            "centered": is_centered,
            "lighting_score": round(lighting_score, 1)
        }

face_detector = FaceDetector()
