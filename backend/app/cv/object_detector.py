import cv2
import numpy as np
from typing import Dict, Any

class ObjectDetector:
    def __init__(self):
        self.yolo_model = None
        self._load_attempted = False
        self.target_classes = ["cell phone", "book", "laptop"]

    def _ensure_model(self):
        if self._load_attempted:
            return
        self._load_attempted = True
        try:
            from ultralytics import YOLO
            self.yolo_model = YOLO("yolov8n.pt")
        except Exception as e:
            print(f"[ObjectDetector] YOLO unavailable: {e}")
            self.yolo_model = None

    def detect_objects(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Detects prohibited objects like mobile phones, laptops, books in the frame.
        """
        if image is None or image.size == 0:
            return {"prohibited_detected": False, "detected_objects": []}

        self._ensure_model()
        detected_objects = []

        if self.yolo_model:
            try:
                results = self.yolo_model(image, verbose=False)
                for r in results:
                    for box in r.boxes:
                        cls_id = int(box.cls[0])
                        class_name = self.yolo_model.names[cls_id]
                        conf = float(box.conf[0])

                        if class_name in self.target_classes and conf > 0.40:
                            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0]]
                            detected_objects.append({
                                "label": class_name,
                                "confidence": round(conf, 2),
                                "bbox": [x1, y1, x2 - x1, y2 - y1]
                            })
            except Exception:
                pass

        return {
            "prohibited_detected": len(detected_objects) > 0,
            "detected_objects": detected_objects
        }

object_detector = ObjectDetector()
