from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import logging
import time

from app.database import get_db
from app.models import File
from app.services.vector_search import get_vector_search_service
from app.schemas import (
    SearchQuery,
    SearchResponse,
    SearchResult,
    CollectionStats
)

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/search", response_model=SearchResponse)
async def search_contracts(
    search_request: SearchQuery,
    db: AsyncSession = Depends(get_db)
):
    """
    Search through contract documents using vector similarity
    
    Body:
    - query: Search query text
    - file_ids: Optional list of file IDs to limit search scope
    - top_k: Number of results to return (default: 5, max: 50)
    """
    try:
        start_time = time.time()
        
        # Validate file_ids if provided
        if search_request.file_ids:
            stmt = select(File.id).where(File.id.in_(search_request.file_ids))
            result = await db.execute(stmt)
            existing_file_ids = [row[0] for row in result.fetchall()]
            
            invalid_file_ids = set(search_request.file_ids) - set(existing_file_ids)
            if invalid_file_ids:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid file IDs: {list(invalid_file_ids)}"
                )
        
        # Perform vector search
        vector_service = get_vector_search_service()
        search_results = await vector_service.search_contracts(
            query=search_request.query,
            file_ids=search_request.file_ids,
            top_k=search_request.top_k
        )
        
        # Convert to response format
        formatted_results = [SearchResult(**result) for result in search_results]
        
        search_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        return SearchResponse(
            query=search_request.query,
            results=formatted_results,
            total_results=len(formatted_results),
            search_time_ms=round(search_time, 2)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in contract search: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/search", response_model=SearchResponse)
async def search_contracts_get(
    query: str = Query(..., min_length=1, max_length=1000, description="Search query"),
    file_ids: Optional[str] = Query(None, description="Comma-separated file IDs"),
    top_k: int = Query(5, ge=1, le=50, description="Number of results to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Search through contract documents using vector similarity (GET method)
    
    Query Parameters:
    - query: Search query text
    - file_ids: Optional comma-separated file IDs to limit search scope
    - top_k: Number of results to return (default: 5, max: 50)
    """
    try:
        # Parse file_ids if provided
        parsed_file_ids = None
        if file_ids:
            parsed_file_ids = [fid.strip() for fid in file_ids.split(",") if fid.strip()]
        
        # Create SearchQuery object
        search_request = SearchQuery(
            query=query,
            file_ids=parsed_file_ids,
            top_k=top_k
        )
        
        # Use the same logic as POST method
        return await search_contracts(search_request, db)
        
    except Exception as e:
        logger.error(f"Error in GET contract search: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.post("/search/file/{file_id}", response_model=SearchResponse)
async def search_within_file(
    file_id: str,
    search_request: SearchQuery,
    db: AsyncSession = Depends(get_db)
):
    """
    Search within a specific contract file
    
    Path:
    - file_id: ID of the file to search within
    
    Body:
    - query: Search query text
    - top_k: Number of results to return (default: 5, max: 50)
    """
    try:
        # Validate file exists
        stmt = select(File).where(File.id == file_id)
        result = await db.execute(stmt)
        file = result.scalar_one_or_none()
        
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        start_time = time.time()
        
        # Search within the specific file
        vector_service = get_vector_search_service()
        search_results = await vector_service.search_by_file(
            query=search_request.query,
            file_id=file_id,
            top_k=search_request.top_k
        )
        
        # Convert to response format
        formatted_results = [SearchResult(**result) for result in search_results]
        
        search_time = (time.time() - start_time) * 1000
        
        return SearchResponse(
            query=search_request.query,
            results=formatted_results,
            total_results=len(formatted_results),
            search_time_ms=round(search_time, 2)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching within file {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File search failed: {str(e)}")

@router.get("/search/file/{file_id}", response_model=SearchResponse)
async def search_within_file_get(
    file_id: str,
    query: str = Query(..., min_length=1, max_length=1000),
    top_k: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """
    Search within a specific contract file (GET method)
    """
    search_request = SearchQuery(query=query, file_ids=None, top_k=top_k)
    return await search_within_file(file_id, search_request, db)

@router.get("/search/similar/{file_id}")
async def find_similar_content(
    file_id: str,
    content: str = Query(..., min_length=10, description="Content to find similar chunks for"),
    top_k: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db)
):
    """
    Find chunks similar to given content
    
    Path:
    - file_id: File ID to compare against (will search in other files)
    
    Query:
    - content: Text content to find similar chunks for
    - top_k: Number of similar chunks to return
    """
    try:
        # Validate file exists
        stmt = select(File).where(File.id == file_id)
        result = await db.execute(stmt)
        file = result.scalar_one_or_none()
        
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Find similar chunks
        vector_service = get_vector_search_service()
        similar_chunks = await vector_service.get_similar_chunks(
            file_id=file_id,
            chunk_content=content,
            top_k=top_k
        )
        
        formatted_results = [SearchResult(**result) for result in similar_chunks]
        
        return {
            "source_file_id": file_id,
            "content_preview": content[:100] + "..." if len(content) > 100 else content,
            "similar_chunks": formatted_results,
            "total_results": len(formatted_results)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding similar content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Similar content search failed: {str(e)}")

@router.get("/stats", response_model=CollectionStats)
async def get_search_stats():
    """
    Get statistics about the vector search collection
    """
    try:
        vector_service = get_vector_search_service()
        stats = await vector_service.get_collection_stats()
        return CollectionStats(**stats)
        
    except Exception as e:
        logger.error(f"Error getting search stats: {str(e)}")
        return CollectionStats(
            total_chunks=0,
            unique_files=0,
            collection_name="contract_chunks",
            error=str(e)
        )
