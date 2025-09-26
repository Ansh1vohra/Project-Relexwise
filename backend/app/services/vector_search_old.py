import logging
from typing import Dict, Any, Optional, List
import json
import re
import time
from llama_index.core import VectorStoreIndex, StorageContext  # type: ignore
from llama_index.vector_stores.chroma import ChromaVectorStore  # type: ignore
from llama_index.llms.google_genai import GoogleGenAI  # type: ignore
import chromadb  # type: ignore
from chromadb.config import DEFAULT_TENANT, DEFAULT_DATABASE
from app.config import settings

logger = logging.getLogger(__name__)

class VectorSearchService:
    def __init__(self):
        # Use the same ChromaDB path and collection as vector processing service
        self.db = chromadb.PersistentClient(
            path=settings.chroma_persist_directory,
            tenant=DEFAULT_TENANT,
            database=DEFAULT_DATABASE,
        )
        self.collection_name = "contracts"  # Same as vector_processing_service
        self.chroma_collection = self.db.get_or_create_collection(
            name=self.collection_name,
            metadata={"description": "Contract document vectors"}
        )
        self.vector_store = ChromaVectorStore(chroma_collection=self.chroma_collection)
        self.storage_context = StorageContext.from_defaults(vector_store=self.vector_store)
        
        # Always try to load index, create empty if no documents
        try:
            if self.chroma_collection.count() > 0:
                logger.info(f"Loading index with {self.chroma_collection.count()} documents")
                self.index = VectorStoreIndex.from_vector_store(
                    self.vector_store, 
                    storage_context=self.storage_context
                )
            else:
                logger.info("No documents found, creating empty index")
                self.index = VectorStoreIndex([], storage_context=self.storage_context)
        except Exception as e:
            logger.warning(f"Error loading index: {e}, creating empty index")
            self.index = VectorStoreIndex([], storage_context=self.storage_context)
        
        # Initialize LLM
        self.llm = GoogleGenAI(
            model="models/gemini-2.0-flash-exp", 
            api_key=settings.google_api_key,
            temperature=0
        )
    
    async def query_file_contracts(self, file_id: str, query: str, top_k: int = 5) -> Dict[str, Any]:
        """
        Query contracts within a specific file using vector search
        
        Args:
            file_id: The file ID to search within
            query: User's query about the contract
            top_k: Number of top results to return
            
        Returns:
            Dictionary with search results
        """
        start_time = time.time()
        
        try:
            # Check if we have any documents in the collection
            collection_count = self.chroma_collection.count()
            logger.info(f"Total documents in collection: {collection_count}")
            
            if collection_count == 0:
                return {
                    "status": "error", 
                    "file_id": file_id,
                    "query": query,
                    "response": {"message": "No documents indexed. Please upload PDFs first."},
                    "sources": [],
                    "search_time_ms": round((time.time() - start_time) * 1000, 2)
                }
            
            # Check if we have documents for this specific file
            file_docs = self.chroma_collection.get(where={"file_id": file_id})
            if not file_docs['ids']:
                return {
                    "status": "error", 
                    "file_id": file_id,
                    "query": query,
                    "response": {"message": f"No documents found for file ID: {file_id}"},
                    "sources": [],
                    "search_time_ms": round((time.time() - start_time) * 1000, 2)
                }
            
            logger.info(f"Found {len(file_docs['ids'])} chunks for file {file_id}")
            logger.info(f"Searching file {file_id} with query: '{query}'")
            
            # Create file-specific query engine with metadata filtering
            query_engine = self.index.as_query_engine(
                llm=self.llm,
                similarity_top_k=min(top_k * 2, len(file_docs['ids'])),  # Get more results to filter
                vector_store_query_mode="default",
                filters={"file_id": file_id}  # Filter by file_id
            )
            
            # Execute the query
            response = query_engine.query(f"Based on the contract document: {query}")
            response_str = str(response)
            
            # Clean the response 
            cleaned_response = self._clean_response(response_str)
            
            # Get source information from the response
            sources = []
            if hasattr(response, 'source_nodes'):
                for node in response.source_nodes[:top_k]:
                    if hasattr(node, 'metadata') and node.metadata.get('file_id') == file_id:
                        sources.append({
                            "chunk_id": node.metadata.get('chunk_index', 0),
                            "text": node.text[:200] + "..." if len(node.text) > 200 else node.text,
                            "score": getattr(node, 'score', 1.0)
                        })
            
            return {
                "status": "success",
                "file_id": file_id,
                "query": query,
                "response": cleaned_response,
                "sources": sources,
                "search_time_ms": round((time.time() - start_time) * 1000, 2)
            }
            
        except Exception as e:
            logger.error(f"Error querying file {file_id}: {str(e)}")
            return {
                "status": "error",
                "file_id": file_id, 
                "query": query,
                "response": {"message": f"Search failed: {str(e)}"},
                "sources": [],
                "search_time_ms": round((time.time() - start_time) * 1000, 2)
            }
    
    def _clean_response(self, response_str: str) -> Any:
        """
        Clean the response to extract JSON or return as string
        """
        try:
            # Remove ```json ... ``` or ``` ... ``` code blocks
            cleaned_str = re.sub(
                r"```(?:json)?\n(.*?)```", 
                r"\1", 
                response_str, 
                flags=re.DOTALL
            ).strip()
            
            # Try to parse as JSON
            try:
                return json.loads(cleaned_str)
            except json.JSONDecodeError:
                # Return as string if not valid JSON
                return cleaned_str
                
        except Exception:
            return response_str
    
    def _extract_sources(self, response) -> list:
        """
        Extract source information from response nodes
        """
        sources = []
        try:
            if hasattr(response, 'source_nodes'):
                for node in response.source_nodes:
                    source_info = {
                        "content": node.text[:200] + "..." if len(node.text) > 200 else node.text,
                        "score": getattr(node, 'score', 0.0),
                        "metadata": getattr(node, 'metadata', {})
                    }
                    sources.append(source_info)
        except Exception as e:
            logger.warning(f"Could not extract sources: {e}")
        
        return sources
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get basic statistics about the vector collection
        """
        try:
            count = self.chroma_collection.count()
            
            # Get unique files
            all_data = self.chroma_collection.get(include=["metadatas"])  # type: ignore
            unique_files = set()
            if all_data.get("metadatas") and isinstance(all_data["metadatas"], list):
                for metadata in all_data["metadatas"]:
                    if metadata and "file_id" in metadata:
                        unique_files.add(metadata["file_id"])
            
            return {
                "total_chunks": count,
                "unique_files": len(unique_files),
                "collection_name": self.collection_name,
                "index_available": self.index is not None
            }
            
        except Exception as e:
            logger.error(f"Error getting collection stats: {str(e)}")
            return {
                "total_chunks": 0,
                "unique_files": 0,
                "collection_name": self.collection_name,
                "index_available": False,
                "error": str(e)
            }

# Global instance variable
_vector_search_service = None

def get_vector_search_service() -> VectorSearchService:
    """Get or create the vector search service instance"""
    global _vector_search_service
    if _vector_search_service is None:
        _vector_search_service = VectorSearchService()
    return _vector_search_service
