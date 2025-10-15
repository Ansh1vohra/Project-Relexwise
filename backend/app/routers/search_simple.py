from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Union, Any
import logging

from app.database import get_db
from app.models import File
from app.services.vector_search import get_vector_search_service
from app.schemas import CollectionStats
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

class FileQueryRequest(BaseModel):
    file_id: str
    query: str

class FileQueryResponse(BaseModel):
    status: str
    file_id: str
    query: str
    response: Union[dict, str, Any]
    sources: list
    search_time_ms: Optional[float] = None

@router.post("/query", response_model=FileQueryResponse)
async def query_file_contracts(
    request: FileQueryRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Query contracts within a specific file using vector search
    
    Body:
    - file_id: The file ID to search within
    - query: User's query about the contract (e.g., "what is the contract value?")
    
    Example:
    {
        "file_id": "abc-123",
        "query": "what is the contract value?"
    }
    """
    try:
        # Validate file exists
        stmt = select(File).where(File.id == request.file_id)
        result = await db.execute(stmt)
        file = result.scalar_one_or_none()
        
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get vector search service
        vector_service = get_vector_search_service()
        
        # Query the file contracts
        search_result = await vector_service.query_file_contracts(
            file_id=request.file_id,
            query=request.query
        )
        
        # Don't add search_time_ms here since it's already included in search_result
        return FileQueryResponse(**search_result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying file contracts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

@router.get("/query/{file_id}")
async def query_file_contracts_get(
    file_id: str,
    query: str = Query(..., description="Your question about the contract"),
    db: AsyncSession = Depends(get_db)
):
    """
    Query contracts within a specific file using vector search (GET method)
    
    Path:
    - file_id: The file ID to search within
    
    Query Parameters:
    - query: Your question about the contract (e.g., "what is the contract value?")
    
    Example:
    GET /api/v1/search/query/abc-123?query=what%20is%20the%20contract%20value?
    """
    request = FileQueryRequest(file_id=file_id, query=query)
    return await query_file_contracts(request, db)

@router.get("/stats", response_model=CollectionStats)
async def get_search_stats():
    """
    Get statistics about the vector search collection
    """
    try:
        vector_service = get_vector_search_service()
        stats = vector_service.get_collection_stats()
        return CollectionStats(**stats)
        
    except Exception as e:
        logger.error(f"Error getting search stats: {str(e)}")
        return CollectionStats(
            total_chunks=0,
            unique_files=0,
            collection_name="contract_chunks",
            error=str(e)
        )
