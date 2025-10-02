from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str = "default"):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(websocket)
        
        logger.info(f"WebSocket connection established for user: {user_id}")

    def disconnect(self, websocket: WebSocket, user_id: str = "default"):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if user_id in self.user_connections and websocket in self.user_connections[user_id]:
            self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        logger.info(f"WebSocket connection closed for user: {user_id}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")

    async def send_to_user(self, message: dict, user_id: str = "default"):
        if user_id in self.user_connections:
            disconnected = []
            for connection in self.user_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected.append(connection)
            
            # Clean up disconnected connections
            for conn in disconnected:
                self.disconnect(conn, user_id)

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected connections
        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)

    async def notify_file_processing_update(self, file_id: str, status: str, 
                                          metadata: dict | None = None, error: str | None = None):
        """Send file processing update to all connected clients"""
        message = {
            "type": "file_processing_update",
            "file_id": file_id,
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata,
            "error": error
        }
        await self.broadcast(message)
        logger.info(f"Broadcasted file processing update for file {file_id}: {status}")

    async def notify_metadata_extracted(self, file_id: str, metadata: dict):
        """Send notification when metadata extraction is complete"""
        message = {
            "type": "metadata_extracted",
            "file_id": file_id,
            "metadata": metadata,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(message)
        logger.info(f"Broadcasted metadata extraction completion for file {file_id}")

    async def notify_vector_processing_complete(self, file_id: str):
        """Send notification when vector processing is complete"""
        message = {
            "type": "vector_processing_complete",
            "file_id": file_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(message)
        logger.info(f"Broadcasted vector processing completion for file {file_id}")

# Global connection manager instance
manager = ConnectionManager()
