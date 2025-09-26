from fastapi import APIRouter, UploadFile, File as FastAPIFile, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import logging
import uuid
from datetime import datetime

from app.database import get_db
from app.models import File, FileMetadata, ProcessingError
from app.schemas import (
    FileUploadResponse, 
    BulkUploadResponse, 
    FileSchema, 
    FileWithMetadataSchema,
    FileStatusResponse,
    ProcessingErrorSchema
)
from app.services.cloudinary_service import cloudinary_service
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# We'll import this globally from main.py later
processing_queue = None

def set_processing_queue(queue):
    """Set the processing queue instance"""
    global processing_queue
    processing_queue = queue

@router.post("/upload", response_model=BulkUploadResponse)
async def upload_files(
    files: List[UploadFile] = FastAPIFile(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload multiple PDF files for processing
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    uploaded_files = []
    failed_uploads = []
    
    for file in files:
        try:
            # Validate file
            if not file.filename:
                failed_uploads.append({
                    "filename": "unknown",
                    "error": "No filename provided"
                })
                continue
                
            await _validate_file(file)
            
            # Read file content
            file_content = await file.read()
            
            # Upload to Cloudinary
            cloudinary_result = await cloudinary_service.upload_file(file_content, file.filename)
            
            # Create database record
            file_id = str(uuid.uuid4())
            db_file = File(
                id=file_id,
                filename=file.filename,
                cloudinary_url=cloudinary_result["secure_url"],
                cloudinary_public_id=cloudinary_result["public_id"],
                file_size=len(file_content),
                upload_timestamp=datetime.utcnow(),
                vector_processing_status="pending",
                metadata_processing_status="pending"
            )
            
            db.add(db_file)
            await db.commit()
            
            # Add to processing queue
            if processing_queue:
                await processing_queue.add_file_for_processing(file_id, file_content, file.filename)
            
            uploaded_files.append(FileUploadResponse(
                file_id=file_id,
                filename=file.filename,
                cloudinary_url=cloudinary_result["secure_url"],
                message="File uploaded successfully and queued for processing"
            ))
            
            logger.info(f"Successfully uploaded file: {file.filename} ({file_id})")
            
        except Exception as e:
            logger.error(f"Failed to upload file {file.filename}: {str(e)}")
            failed_uploads.append({
                "filename": file.filename,
                "error": str(e)
            })
    
    return BulkUploadResponse(
        uploaded_files=uploaded_files,
        failed_uploads=failed_uploads,
        total_files=len(files),
        successful_uploads=len(uploaded_files),
        failed_uploads_count=len(failed_uploads)
    )

@router.get("/files", response_model=List[FileSchema])
async def get_files(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of uploaded files with their processing status
    """
    try:
        stmt = select(File).offset(offset).limit(limit)
        result = await db.execute(stmt)
        files = result.scalars().all()
        
        return files
        
    except Exception as e:
        logger.error(f"Error fetching files: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching files")

@router.get("/files/{file_id}", response_model=FileWithMetadataSchema)
async def get_file(
    file_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get specific file details with processing status
    """
    try:
        stmt = select(File).options(selectinload(File.file_metadata)).where(File.id == file_id)
        result = await db.execute(stmt)
        file = result.scalar_one_or_none()
        
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        return file
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching file")

@router.get("/files/{file_id}/status", response_model=FileStatusResponse)
async def get_file_status(
    file_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get file processing status
    """
    try:
        # Get file
        stmt = select(File).where(File.id == file_id)
        result = await db.execute(stmt)
        file = result.scalar_one_or_none()
        
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get errors
        error_stmt = select(ProcessingError).where(
            ProcessingError.file_id == file_id,
            ProcessingError.resolved == False
        )
        error_result = await db.execute(error_stmt)
        errors = error_result.scalars().all()
        
        error_messages = [error.error_message for error in errors]
        
        return FileStatusResponse(
            file_id=file_id,
            filename=file.filename,  # type: ignore
            vector_processing_status=file.vector_processing_status,  # type: ignore
            metadata_processing_status=file.metadata_processing_status,  # type: ignore
            processing_attempts=file.processing_attempts,  # type: ignore
            errors=error_messages  # type: ignore
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching file status for {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching file status")

@router.get("/files/{file_id}/metadata")
async def get_file_metadata(
    file_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get extracted metadata for a file
    """
    try:
        stmt = select(FileMetadata).where(FileMetadata.file_id == file_id)
        result = await db.execute(stmt)
        metadata = result.scalar_one_or_none()
        
        if not metadata:
            raise HTTPException(status_code=404, detail="Metadata not found for this file")
        
        return metadata
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching metadata for file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching metadata")

@router.get("/errors", response_model=List[ProcessingErrorSchema])
async def get_processing_errors(
    resolved: bool = False,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """
    Get processing errors
    """
    try:
        stmt = select(ProcessingError).where(
            ProcessingError.resolved == resolved
        ).offset(offset).limit(limit)
        
        result = await db.execute(stmt)
        errors = result.scalars().all()
        
        return errors
        
    except Exception as e:
        logger.error(f"Error fetching processing errors: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching errors")

@router.get("/queue/status")
async def get_queue_status():
    """
    Get current processing queue status
    """
    if not processing_queue:
        raise HTTPException(status_code=503, detail="Processing queue not available")
    
    try:
        status = await processing_queue.get_queue_status()
        return status
    except Exception as e:
        logger.error(f"Error fetching queue status: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching queue status")

@router.delete("/files/{file_id}")
async def delete_file(
    file_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a file and all associated data
    """
    try:
        # Get file
        stmt = select(File).where(File.id == file_id)
        result = await db.execute(stmt)
        file = result.scalar_one_or_none()
        
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Delete from Cloudinary
        await cloudinary_service.delete_file(file.cloudinary_public_id)  # type: ignore
        
        # Delete vectors from ChromaDB
        from app.services.vector_processing import vector_processing_service
        await vector_processing_service.delete_file_vectors(file_id)
        
        # Delete from database (cascade will handle metadata and errors)
        await db.delete(file)
        await db.commit()
        
        return {"message": f"File {file.filename} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file {file_id}: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Error deleting file")

async def _validate_file(file: UploadFile):
    """
    Validate uploaded file
    """
    # Check filename exists
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    # Check file extension
    if not any(file.filename.lower().endswith(ext) for ext in settings.allowed_extensions):
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {settings.allowed_extensions}"
        )
    
    # Reset file position to read size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    # Check file size
    if file_size > settings.max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_file_size / (1024*1024):.1f}MB"
        )
    
    # Check if file is empty
    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")
