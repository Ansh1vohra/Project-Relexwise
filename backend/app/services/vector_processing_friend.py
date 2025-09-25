import asyncio
import logging
import tempfile
import os
from typing import Dict, Any
from llama_index.core import Document
from app.services.vector_search import get_vector_search_service

logger = logging.getLogger(__name__)

class FriendVectorProcessingService:
    """
    Vector processing service that integrates with friend's LlamaIndex approach
    """
    
    def __init__(self):
        self.vector_service = get_vector_search_service()
        logger.info("Friend's vector processing service initialized")
    
    async def process_pdf_file(self, file_id: str, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Process a PDF file using friend's LlamaIndex approach
        """
        try:
            # Save file content to temporary file for LlamaParse
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
                temp_file.write(file_content)
                temp_file_path = temp_file.name
            
            logger.info(f"Processing {filename} with friend's LlamaIndex approach")
            
            # Use friend's upload method
            result = self.vector_service.upload_pdfs([temp_file_path])
            
            # Clean up temporary file
            os.unlink(temp_file_path)
            
            # Update the metadata for the uploaded documents with our file_id
            await self._update_document_metadata(file_id, filename)
            
            logger.info(f"Successfully processed {filename} using friend's system")
            return result
            
        except Exception as e:
            logger.error(f"Error processing PDF {filename}: {str(e)}")
            return {"status": "error", "message": f"Processing failed: {str(e)}"}
    
    async def _update_document_metadata(self, file_id: str, filename: str):
        """
        Update document metadata to include our file_id
        """
        try:
            # Get all documents from the collection
            collection = self.vector_service.chroma_collection
            all_docs = collection.get(include=["metadatas"])
            
            # Find documents that match the filename and don't have our file_id
            if all_docs.get("metadatas"):
                for i, metadata in enumerate(all_docs["metadatas"]):
                    if (metadata and 
                        metadata.get("file_name") == filename and 
                        not metadata.get("original_file_id")):
                        
                        # Update metadata to include our file_id
                        doc_id = all_docs["ids"][i]
                        updated_metadata = {**metadata, "original_file_id": file_id}
                        
                        collection.update(
                            ids=[doc_id],
                            metadatas=[updated_metadata]
                        )
                        logger.info(f"Updated metadata for document {doc_id} with file_id {file_id}")
                        
        except Exception as e:
            logger.warning(f"Could not update document metadata: {str(e)}")
    
    async def process_text_to_vectors(self, file_id: str, text: str):
        """
        Legacy method for compatibility with existing processing queue
        Now uses friend's approach internally
        """
        try:
            # Create a temporary PDF-like document for friend's system
            # Since friend's system expects PDFs, we'll create a document and let it handle chunking
            document = Document(
                text=text,
                metadata={"file_id": file_id, "file_name": f"text_document_{file_id}"}
            )
            
            # Add to friend's index directly
            if self.vector_service.index is None:
                from llama_index.core import VectorStoreIndex
                self.vector_service.index = VectorStoreIndex.from_documents(
                    [document], 
                    storage_context=self.vector_service.storage_context
                )
            else:
                # Add to existing index
                self.vector_service.index.insert(document)
            
            logger.info(f"Successfully processed text for file_id {file_id}")
            return {"status": "success", "message": "Text processed successfully"}
            
        except Exception as e:
            logger.error(f"Error processing text for file_id {file_id}: {str(e)}")
            raise

# Create the service instance
friend_vector_processing_service = FriendVectorProcessingService()
