import os
import uuid
import json
import re
import logging
import asyncio
from typing import List, Dict, Any
from datetime import datetime
from llama_parse import LlamaParse, ResultType
from llama_index.core import VectorStoreIndex, Settings, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding
from llama_index.llms.google_genai import GoogleGenAI
import chromadb
from app.config import settings

logger = logging.getLogger(__name__)

# --- SETTINGS ---
Settings.embed_model = GoogleGenAIEmbedding(model_name="text-embedding-004", embed_batch_size=32)
Settings.chunk_size = 1024
Settings.chunk_overlap = 200

class VectorSearchService:
    def __init__(self):
        # --- PERSISTENT STORAGE ---
        self.db = chromadb.PersistentClient(path="./chroma2_db")
        self.collection_name = "contract_docs"
        self.chroma_collection = self.db.get_or_create_collection(self.collection_name)
        self.vector_store = ChromaVectorStore(chroma_collection=self.chroma_collection)
        self.storage_context = StorageContext.from_defaults(vector_store=self.vector_store)
        
        # Load index and LLM once at module load
        self.index = None
        if self.chroma_collection.count() > 0:
            self.index = VectorStoreIndex.from_vector_store(self.vector_store, storage_context=self.storage_context)
            logger.info(f"Loaded existing index with {self.chroma_collection.count()} documents")
        else:
            logger.info("No documents found in collection")
        
        self.llm = GoogleGenAI(model="models/gemini-2.0-flash-exp", temperature=0)
        
        # Initialize parser for future uploads
        self.parser = LlamaParse(
            result_type=ResultType.MD,
            disable_ocr=False,
            auto_mode=True,
            auto_mode_trigger_on_image_in_page=True,
            verbose=True
        )
        
        logger.info("Vector search service initialized with friend's implementation")
    
    def upload_pdfs(self, file_paths: List[str]) -> Dict[str, Any]:
        """
        Upload and index a list of PDF files into Chroma.
        """
        try:
            docs = []

            # Load and prepare documents
            for file_path in file_paths:
                filename = os.path.basename(file_path)
                logger.info(f"Processing {filename}...")
                documents = self.parser.load_data(file_path)
                file_id = str(uuid.uuid4().hex[:8])
                for d in documents:
                    d.metadata = {"file_id": file_id, "file_name": filename}
                docs.extend(documents)

            if docs:
                self.index = VectorStoreIndex.from_documents(docs, storage_context=self.storage_context)
                return {"status": "success", "message": f"{len(file_paths)} file(s) uploaded and indexed."}
            else:
                return {"status": "empty", "message": "No valid PDF files to upload."}

        except Exception as e:
            logger.error(f"Error uploading PDFs: {str(e)}")
            return {"status": "error", "message": f"An error occurred while uploading: {str(e)}"}
    
    async def query_file_contracts(self, file_id: str, query: str) -> Dict[str, Any]:
        """
        Query the indexed documents for contract information.
        Uses the original friend's implementation with file_id filtering.
        """
        start_time = datetime.now()
        
        try:
            if self.index is None:
                return {
                    "status": "error",
                    "file_id": file_id,
                    "query": query,
                    "response": {"message": "No documents indexed. Please upload PDFs first."},
                    "sources": [],
                    "search_time_ms": (datetime.now() - start_time).total_seconds() * 1000
                }

            # Create query engine with friend's exact parameters
            query_engine = self.index.as_query_engine(
                llm=self.llm,
                similarity_top_k=95,
                vector_store_query="mmr",
                alpha=0.5
            )
            
            # Enhanced query with file_id context
            enhanced_query = f"For file with file_id {file_id}, answer this question: {query}"
            
            # Run the query in a thread to avoid event loop conflicts
            try:
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(None, query_engine.query, enhanced_query)
            except Exception as query_error:
                logger.error(f"Query execution error: {str(query_error)}")
                # Fallback: try direct call
                response = query_engine.query(enhanced_query)
                
            response_str = str(response)

            # Remove ```json ... ``` or ``` ... ``` code blocks (friend's cleaning logic)
            cleaned_str = re.sub(r"```(?:json)?\n(.*?)```", r"\1", response_str, flags=re.DOTALL).strip()

            # Try to parse as JSON
            try:
                data_json = json.loads(cleaned_str)
            except json.JSONDecodeError:
                # Fallback: return as a string if parsing fails
                data_json = {"raw_response": cleaned_str}

            # Extract sources with file filtering
            sources = []
            if hasattr(response, 'source_nodes'):
                for node in response.source_nodes:
                    if hasattr(node, 'metadata'):
                        metadata = node.metadata
                        # Only include sources from requested file
                        if metadata.get('file_id') == file_id:
                            sources.append({
                                "chunk_id": metadata.get('chunk_id', 'unknown'),
                                "file_name": metadata.get('file_name', 'unknown'),
                                "page": metadata.get('page', 'unknown'),
                                "score": getattr(node, 'score', 0.0)
                            })

            search_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return {
                "status": "success",
                "file_id": file_id,
                "query": query,
                "response": data_json,
                "sources": sources,
                "search_time_ms": round(search_time, 2)
            }

        except Exception as e:
            search_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.error(f"Error in query_file_contracts: {str(e)}")
            return {
                "status": "error",
                "file_id": file_id,
                "query": query,
                "response": {"message": f"An error occurred during querying: {e}"},
                "sources": [],
                "search_time_ms": round(search_time, 2)
            }

    def query_contracts(self, prompt: str) -> Dict[str, Any]:
        """
        Query the indexed documents for contract information.
        This is your friend's original implementation for general queries.
        """
        if self.index is None:
            return {"status": "error", "message": "No documents indexed. Please upload PDFs first."}

        try:
            query_engine = self.index.as_query_engine(
                llm=self.llm,
                similarity_top_k=95,
                vector_store_query="mmr",
                alpha=0.5
            )
            response = query_engine.query(prompt)
            response_str = str(response)

            # Remove ```json ... ``` or ``` ... ``` code blocks
            cleaned_str = re.sub(r"```(?:json)?\n(.*?)```", r"\1", response_str, flags=re.DOTALL).strip()

            # Try to parse as JSON
            try:
                data_json = json.loads(cleaned_str)
            except json.JSONDecodeError:
                # Fallback: return as a string if parsing fails
                data_json = {"raw_response": cleaned_str}

            return {"status": "success", "data": data_json}

        except Exception as e:
            return {"status": "error", "message": f"An error occurred during querying: {e}"}

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector collection"""
        try:
            total_chunks = self.chroma_collection.count()
            
            # Get unique files by querying the collection
            unique_files = 0
            if total_chunks > 0:
                # Get all documents to count unique file_ids
                all_docs = self.chroma_collection.get()
                if all_docs and 'metadatas' in all_docs and all_docs['metadatas']:
                    file_ids = set()
                    for metadata in all_docs['metadatas']:
                        if metadata and 'file_id' in metadata:
                            file_ids.add(metadata['file_id'])
                    unique_files = len(file_ids)
            
            return {
                "total_chunks": total_chunks,
                "unique_files": unique_files,
                "collection_name": self.collection_name,
                "error": None
            }
        except Exception as e:
            logger.error(f"Error getting collection stats: {str(e)}")
            return {
                "total_chunks": 0,
                "unique_files": 0,
                "collection_name": self.collection_name,
                "error": str(e)
            }

# Global instance
_vector_search_service = None

def get_vector_search_service() -> VectorSearchService:
    """Get or create vector search service instance"""
    global _vector_search_service
    if _vector_search_service is None:
        _vector_search_service = VectorSearchService()
    return _vector_search_service
