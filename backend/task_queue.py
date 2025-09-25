import asyncio
import uuid
from typing import List, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TaskQueue:
    def __init__(self):
        self.queue = asyncio.Queue()
        self.results = {}
        self.worker_task = None
        self.running = False

    async def start_worker(self):
        """Start the background worker to process tasks"""
        if self.running:
            return
        
        self.running = True
        self.worker_task = asyncio.create_task(self._worker())
        logger.info("Task queue worker started")

    async def stop_worker(self):
        """Stop the background worker"""
        self.running = False
        if self.worker_task:
            self.worker_task.cancel()
            try:
                await self.worker_task
            except asyncio.CancelledError:
                pass
        logger.info("Task queue worker stopped")

    async def _worker(self):
        """Background worker that processes tasks from the queue"""
        while self.running:
            try:
                task = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                task_id = task["id"]
                file_paths = task["file_paths"]
                
                logger.info(f"Processing task {task_id} with {len(file_paths)} files")
                
                # Set status to processing
                self.results[task_id] = {
                    "status": "processing",
                    "message": f"Processing {len(file_paths)} file(s)..."
                }
                
                try:
                    # Import here to avoid circular imports and ensure env vars are loaded
                    from services.async_upload_service import async_upload_pdfs
                    
                    # Use the async version directly since we're already in an async context
                    result = await async_upload_pdfs(file_paths)
                    
                    self.results[task_id] = result
                    logger.info(f"Task {task_id} completed successfully")
                    
                except Exception as e:
                    logger.error(f"Task {task_id} failed: {str(e)}")
                    self.results[task_id] = {
                        "status": "error",
                        "message": f"Upload failed: {str(e)}"
                    }
                
                finally:
                    self.queue.task_done()
                    
            except asyncio.TimeoutError:
                # No task in queue, continue
                continue
            except Exception as e:
                logger.error(f"Worker error: {str(e)}")

    async def add_upload_task(self, file_paths: List[str]) -> str:
        """Add an upload task to the queue and return task ID"""
        task_id = str(uuid.uuid4())
        task = {
            "id": task_id,
            "file_paths": file_paths
        }
        
        # Initialize result as queued
        self.results[task_id] = {
            "status": "queued",
            "message": f"Task queued with {len(file_paths)} file(s)"
        }
        
        await self.queue.put(task)
        logger.info(f"Added task {task_id} to queue")
        return task_id

    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get the status of a specific task"""
        return self.results.get(task_id, {
            "status": "not_found",
            "message": "Task not found"
        })

    def get_queue_info(self) -> Dict[str, Any]:
        """Get information about the queue"""
        return {
            "queue_size": self.queue.qsize(),
            "total_tasks": len(self.results),
            "worker_running": self.running
        }

# Global task queue instance
task_queue = TaskQueue()
