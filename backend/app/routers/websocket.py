from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.websocket import manager
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, user_id: str = Query(default="default")):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep the connection alive and listen for client messages
            data = await websocket.receive_text()
            # You can handle client messages here if needed
            logger.info(f"Received message from {user_id}: {data}")
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        logger.info(f"Client {user_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, user_id)
