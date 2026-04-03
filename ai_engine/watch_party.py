from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
import uuid
import time
from database import WatchParty, User

party_router = APIRouter(prefix="/api/party", tags=["party"])

class ConnectionManager:
    def __init__(self):
        # Maps room_id -> list of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Maps room_id -> state dict
        self.room_states: Dict[str, dict] = {}
        
    async def connect(self, websocket: WebSocket, room_id: str, username: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
            
        if room_id not in self.room_states:
             self.room_states[room_id] = {
                 "host": username,
                 "status": "paused",
                 "timestamp": 0.0,
                 "movie_id": None, # Will be set on first connect or via create
                 "last_updated": time.time(),
                 "participants": []
             }
             
        self.active_connections[room_id].append(websocket)
        
        if username not in self.room_states[room_id]["participants"]:
            self.room_states[room_id]["participants"].append(username)
            
        await self.broadcast(room_id, {
            "type": "system",
            "message": f"{username} joined the party",
            "participants": self.room_states[room_id]["participants"],
            "state": {
               "status": self.room_states[room_id]["status"],
               "timestamp": self.room_states[room_id]["timestamp"],
               "movie_id": self.room_states[room_id]["movie_id"]
            }
        })

    def disconnect(self, websocket: WebSocket, room_id: str, username: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if username in self.room_states[room_id]["participants"]:
                self.room_states[room_id]["participants"].remove(username)
            
            if len(self.active_connections[room_id]) == 0:
                del self.active_connections[room_id]
                del self.room_states[room_id]
            else:
                # If host left, assign new host (simple logic: first person)
                if self.room_states[room_id]["host"] == username and self.room_states[room_id]["participants"]:
                    self.room_states[room_id]["host"] = self.room_states[room_id]["participants"][0]

    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

@party_router.post("/create")
def create_party(movie_id: int):
    room_id = str(uuid.uuid4())[:8]
    # Initialize room state so the first person joining knows the movie_id
    manager.room_states[room_id] = {
        "host": None,
        "status": "paused",
        "timestamp": 0.0,
        "movie_id": movie_id,
        "last_updated": time.time(),
        "participants": []
    }
    return {"room_id": room_id, "movie_id": movie_id, "share_link": f"/party/{room_id}"}

@party_router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, username: str = "Guest"):
    await manager.connect(websocket, room_id, username)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            action = payload.get("action")
            
            state = manager.room_states.get(room_id, {})
            # Only host can control playback natively, but for demo we allow any
            if action in ["play", "pause", "seek"]:
                state["status"] = payload.get("status", "paused")
                state["timestamp"] = payload.get("timestamp", 0.0)
                state["last_updated"] = time.time()
                
                await manager.broadcast(room_id, {
                    "type": "sync",
                    "status": state["status"],
                    "timestamp": state["timestamp"],
                    "sender": username
                })
            elif action == "chat":
                await manager.broadcast(room_id, {
                    "type": "chat",
                    "sender": username,
                    "text": payload.get("text", "")
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id, username)
        await manager.broadcast(room_id, {
            "type": "system",
            "message": f"{username} left the party",
            "participants": manager.room_states.get(room_id, {}).get("participants", [])
        })
