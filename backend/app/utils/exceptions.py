from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import logging
from typing import Union, Optional
import traceback

logger = logging.getLogger("errors")

class ProcessingException(Exception):
    """Custom exception for processing errors"""
    def __init__(self, message: str, error_type: str = "processing_error", details: Optional[str] = None):
        self.message = message
        self.error_type = error_type
        self.details = details
        super().__init__(self.message)

class ValidationException(Exception):
    """Custom exception for validation errors"""
    def __init__(self, message: str, field: Optional[str] = None):
        self.message = message
        self.field = field
        super().__init__(self.message)

async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled exceptions
    """
    error_id = id(exc)
    
    # Log the full error
    logger.error(f"Unhandled exception {error_id}: {str(exc)}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    
    # Return generic error response
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "error_id": error_id
        }
    )

async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Handler for HTTP exceptions
    """
    logger.warning(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Error",
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )

async def processing_exception_handler(request: Request, exc: ProcessingException):
    """
    Handler for custom processing exceptions
    """
    logger.error(f"Processing Exception: {exc.error_type} - {exc.message}")
    if exc.details:
        logger.error(f"Details: {exc.details}")
    
    return JSONResponse(
        status_code=422,
        content={
            "error": "Processing Error",
            "message": exc.message,
            "error_type": exc.error_type,
            "details": exc.details
        }
    )

async def validation_exception_handler(request: Request, exc: ValidationException):
    """
    Handler for custom validation exceptions
    """
    logger.warning(f"Validation Exception: {exc.message}")
    
    return JSONResponse(
        status_code=400,
        content={
            "error": "Validation Error",
            "message": exc.message,
            "field": exc.field
        }
    )
