import json
from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session as DBSession
from app.core.database import SessionLocal
from app.models.session import Session
from app.proctoring.session_monitor import session_monitor

router = APIRouter(tags=["Real-time Proctoring WebSocket"])

class ConnectionManager:
    def __init__(self):
        # session_id -> list of connected WebSockets (candidate + proctor viewers)
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

@router.websocket("/ws/proctor/{session_id}")
async def proctor_websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    db: DBSession = SessionLocal()
    try:
        session = db.query(Session).filter(Session.id == session_id).first()
        proctoring_level = session.exam.proctoring_level if session and session.exam else "standard"

        while True:
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
            except Exception:
                continue

            msg_type = data.get("type", "frame")

            if msg_type == "frame":
                frame_b64 = data.get("frame")
                if frame_b64:
                    # Process frame
                    analysis = session_monitor.process_frame(
                        db=db,
                        session_id=session_id,
                        base64_frame=frame_b64,
                        proctoring_level=proctoring_level
                    )
                    # Send response back to candidate and broadcast to proctor viewers
                    response = {
                        "type": "proctor_update",
                        "data": analysis
                    }
                    await manager.broadcast(session_id, response)

            elif msg_type == "event":
                # Candidate sent client-side event (e.g. FULLSCREEN_EXITED)
                event_name = data.get("event_type", "FULLSCREEN_EXITED")
                session_monitor._record_event(db, session_id, event_name, 1.0)
                await manager.broadcast(session_id, {
                    "type": "event_alert",
                    "event_type": event_name,
                    "message": data.get("message", f"Event triggered: {event_name}")
                })

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(session_id, websocket)
    finally:
        db.close()
