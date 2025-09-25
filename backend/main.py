import os
import shutil
from typing import List
from fastapi import FastAPI, UploadFile, File # type: ignore
from fastapi.responses import JSONResponse # type: ignore
from dotenv import load_dotenv # type: ignore
from constants import PROMPT,UPLOAD_DIR
from task_queue import task_queue

load_dotenv(dotenv_path=".env")

# Get API keys with error handling
llama_api_key = os.getenv("LLAMA_CLOUD_API_KEY")
google_api_key = os.getenv("GOOGLE_API_KEY")

if not llama_api_key:
    raise ValueError("LLAMA_CLOUD_API_KEY not found in environment variables")
if not google_api_key:
    raise ValueError("GOOGLE_API_KEY not found in environment variables")

os.environ["LLAMA_CLOUD_API_KEY"] = llama_api_key
os.environ["GOOGLE_API_KEY"] = google_api_key

from services.upload_service import upload_pdfs
from services.query_service import query_contracts  

# --- FASTAPI APP ---
app = FastAPI(title="Contract PDF Service")

os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.on_event("startup")
async def startup_event():
    """Start the task queue worker on application startup"""
    await task_queue.start_worker()

@app.on_event("shutdown")
async def shutdown_event():
    """Stop the task queue worker on application shutdown"""
    await task_queue.stop_worker()

@app.post("/upload-contracts")
async def upload_endpoint(files: List[UploadFile] = File(...)):
    """
    Endpoint to upload and index PDF files using task queue.
    Returns task ID for tracking progress.
    """
    print("Received upload request...")
    try:
        file_paths = []
        for file in files:
            if file.filename:  # Check if filename exists
                file_path = os.path.join(UPLOAD_DIR, file.filename)
                with open(file_path, "wb") as f:
                    shutil.copyfileobj(file.file, f)
                file_paths.append(file_path)

        # Add task to queue instead of processing immediately
        task_id = await task_queue.add_upload_task(file_paths)
        
        return JSONResponse(content={
            "status": "queued",
            "task_id": task_id,
            "message": f"Upload task queued with {len(file_paths)} file(s). Use /task-status/{task_id} to check progress."
        })

    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.get("/task-status/{task_id}")
async def get_task_status(task_id: str):
    """
    Get the status of an upload task.
    """
    try:
        result = task_queue.get_task_status(task_id)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.get("/queue-info")
async def get_queue_info():
    """
    Get information about the task queue.
    """
    try:
        info = task_queue.get_queue_info()
        return JSONResponse(content=info)
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.get("/query-contracts")
async def query_endpoint():
    """
    Endpoint to query indexed PDFs for contract information.
    """
    try:
        result = query_contracts(prompt=PROMPT)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})
    
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "contract-rag"}

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Contract PDF Service",
        "endpoints": {
            "upload": "/upload-contracts - Upload PDF files (returns task_id)",
            "task_status": "/task-status/{task_id} - Check upload task progress",
            "query": "/query-contracts - Query contract information",
            "queue_info": "/queue-info - Get queue information",
            "health": "/health - Health check"
        }
    }
