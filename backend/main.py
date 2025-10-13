from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from app.database import create_tables
from app.routers import files
from app.routers import search_simple as search
from app.routers import websocket
from app.services.processing_queue import ProcessingQueue
from app.utils.logging import setup_logging
from app.utils.exceptions import (
    global_exception_handler,
    http_exception_handler,
    processing_exception_handler,
    validation_exception_handler,
    ProcessingException,
    ValidationException
)

# Setup logging first
setup_logging()
logger = logging.getLogger(__name__)

# Initialize the processing queue globally
processing_queue = ProcessingQueue()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up...")
    await create_tables()
    await processing_queue.start()
    
    # Set the processing queue in the router
    from app.routers.files import set_processing_queue
    set_processing_queue(processing_queue)
    
    yield
    # Shutdown
    logger.info("Shutting down...")
    await processing_queue.stop()

app = FastAPI(
    title="Contract Processing API",
    description="API for uploading and processing contracts with vector and metadata extraction",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add exception handlers
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(ProcessingException, processing_exception_handler)
app.add_exception_handler(ValidationException, validation_exception_handler)

# Include routers
app.include_router(files.router, prefix="/api/v1", tags=["files"])
app.include_router(search.router, prefix="/api/v1/search", tags=["search"])
app.include_router(websocket.router, tags=["websocket"])

# Set the processing queue in the files router
files.set_processing_queue(processing_queue)

@app.get("/")
async def root():
    return {"message": "Contract Processing API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
