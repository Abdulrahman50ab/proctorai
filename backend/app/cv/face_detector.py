import os
import threading
import cv2
import numpy as np
import base64
from typing import Dict, Any, List, Optional


class FaceDetector:
    def __init__(self):
        self.yunet_detector = None
        self.face_cascade = None
        self._yunet_lock = threading.Lock()
        self._yunet_input_size = None
        self.model_path = os.path.join(os.path.dirname(__file__), "models", "face_detection_yunet.onnx")
        self.cascade_path = os.path.join(os.path.dirname(__file__), "models", "haarcascade_frontalface_default.xml")

        # 1. YuNet neural face detector
        if os.path.exists(self.model_path) and hasattr(cv2, "FaceDetectorYN"):
            try:
                self.yunet_detector = cv2.FaceDetectorYN.create(
                    model=self.model_path,
                    config="",
                    input_size=(320, 240),
                    score_threshold=0.45,
                    nms_threshold=0.3,
                    top_k=10,
                )
                self._yunet_input_size = (320, 240)
            except Exception as e:
                print(f"[FaceDetector] YuNet init failed: {e}")
                self.yunet_detector = None

        # 2. Haar cascade (bundled file, then OpenCV built-in)
        cascade_candidates = [self.cascade_path]
        if hasattr(cv2, "data") and hasattr(cv2.data, "haarcascades"):
            cascade_candidates.append(
                os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
            )
        for path in cascade_candidates:
            if os.path.exists(path):
                try:
                    cascade = cv2.CascadeClassifier(path)
                    if cascade is not None and not cascade.empty():
                        self.face_cascade = cascade
                        break
                except Exception:
                    continue

        # 3. MediaPipe Face Detection fallback
        self.mp_face_detection = None
        self.mp_detector = None
        try:
            import mediapipe as mp
            self.mp_face_detection = mp.solutions.face_detection
            self.mp_detector = self.mp_face_detection.FaceDetection(
                model_selection=1, min_detection_confidence=0.4
            )
        except Exception as e:
            print(f"[FaceDetector] MediaPipe unavailable: {e}")
            self.mp_detector = None

    def decode_image(self, base64_str: str) -> Optional[np.ndarray]:
        """Decodes a base64 JPEG/PNG string into an OpenCV BGR image."""
        if not base64_str:
            return None
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]
        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img

    def _detect_yunet(self, image: np.ndarray) -> tuple:
        faces_boxes: List[List[int]] = []
        face_landmarks: List[List[tuple]] = []
        if not self.yunet_detector:
            return faces_boxes, face_landmarks

        h, w = image.shape[:2]
        try:
            with self._yunet_lock:
                size = (int(w), int(h))
                if self._yunet_input_size != size:
                    self.yunet_detector.setInputSize(size)
                    self._yunet_input_size = size
                result = self.yunet_detector.detect(image)

            detections = result[1] if isinstance(result, tuple) else result
            if detections is None or len(detections) == 0:
                return faces_boxes, face_landmarks

            for det in detections:
                det = np.asarray(det).flatten()
                if det.size < 5:
                    continue
                fx, fy, fw, fh = int(det[0]), int(det[1]), int(det[2]), int(det[3])
                conf = float(det[-1])
                if conf < 0.40 or fw < 16 or fh < 16:
                    continue
                fx = max(0, fx)
                fy = max(0, fy)
                faces_boxes.append([fx, fy, fw, fh])
                if det.size >= 15:
                    face_landmarks.append([
                        (int(det[4]), int(det[5])),
                        (int(det[6]), int(det[7])),
                        (int(det[8]), int(det[9])),
                        (int(det[10]), int(det[11])),
                        (int(det[12]), int(det[13])),
                    ])
        except Exception as e:
            print(f"[FaceDetector] YuNet detect error: {e}")
        return faces_boxes, face_landmarks

    def _detect_mediapipe(self, image: np.ndarray) -> List[List[int]]:
        faces_boxes: List[List[int]] = []
        if not self.mp_detector:
            return faces_boxes
        h, w = image.shape[:2]
        try:
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = self.mp_detector.process(rgb_image)
            if not results.detections:
                return faces_boxes
            for detection in results.detections:
                bbox = detection.location_data.relative_bounding_box
                xmin = int(bbox.xmin * w)
                ymin = int(bbox.ymin * h)
                box_w = int(bbox.width * w)
                box_h = int(bbox.height * h)
                if box_w >= 16 and box_h >= 16:
                    faces_boxes.append([max(0, xmin), max(0, ymin), box_w, box_h])
        except Exception as e:
            print(f"[FaceDetector] MediaPipe detect error: {e}")
        return faces_boxes

    def _detect_haar(self, gray: np.ndarray) -> List[List[int]]:
        faces_boxes: List[List[int]] = []
        if not self.face_cascade or self.face_cascade.empty():
            return faces_boxes
        try:
            equalized = cv2.equalizeHist(gray)
            detected = self.face_cascade.detectMultiScale(
                equalized,
                scaleFactor=1.08,
                minNeighbors=3,
                minSize=(24, 24),
                flags=cv2.CASCADE_SCALE_IMAGE,
            )
            for (x, y, fw, fh) in detected:
                faces_boxes.append([int(x), int(y), int(fw), int(fh)])
        except Exception as e:
            print(f"[FaceDetector] Haar detect error: {e}")
        return faces_boxes

    def detect_faces(self, image: np.ndarray) -> Dict[str, Any]:
        empty = {
            "face_detected": False,
            "face_count": 0,
            "faces": [],
            "centered": False,
            "lighting_score": 0.0,
            "landmarks": [],
        }
        if image is None or image.size == 0:
            return empty

        h, w = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))
        lighting_score = min(100.0, max(0.0, (brightness / 255.0) * 100))

        faces_boxes: List[List[int]] = []
        face_landmarks: List[List[tuple]] = []

        yunet_boxes, yunet_lms = self._detect_yunet(image)
        faces_boxes.extend(yunet_boxes)
        face_landmarks.extend(yunet_lms)

        if not faces_boxes:
            faces_boxes.extend(self._detect_mediapipe(image))

        if not faces_boxes:
            faces_boxes.extend(self._detect_haar(gray))

        face_count = len(faces_boxes)
        face_detected = face_count > 0

        is_centered = False
        if face_detected:
            fx, fy, fw, fh = faces_boxes[0]
            face_center_x = fx + fw / 2
            face_center_y = fy + fh / 2
            x_diff = abs(face_center_x - (w / 2)) / max(w, 1)
            y_diff = abs(face_center_y - (h / 2)) / max(h, 1)
            is_centered = x_diff < 0.35 and y_diff < 0.35

        return {
            "face_detected": face_detected,
            "face_count": face_count,
            "faces": faces_boxes,
            "centered": is_centered,
            "lighting_score": round(lighting_score, 1),
            "landmarks": face_landmarks,
        }


face_detector = FaceDetector()
