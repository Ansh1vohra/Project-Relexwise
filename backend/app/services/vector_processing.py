import chromadb
from chromadb.config import DEFAULT_TENANT, DEFAULT_DATABASE
import google.generativeai as genai
from app.config import settings
import logging
from typing import List, Optional
import tiktoken
import hashlib
import os

logger = logging.getLogger(__name__)

# Configure Google Generative AI
genai.configure(api_key=settings.google_api_key)

class VectorProcessingService:
    def __init__(self):
        # Initialize ChromaDB client with updated API
        self.chroma_client = chromadb.PersistentClient(
            path=settings.chroma_persist_directory,
            tenant=DEFAULT_TENANT,
            database=DEFAULT_DATABASE,
        )
        
        # Get or create collection
        self.collection = self.chroma_client.get_or_create_collection(
            name="contracts",
            metadata={"description": "Contract document vectors"}
        )
        
        # Initialize tokenizer for text chunking
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        
        # Google embedding model
        self.embedding_model = "models/text-embedding-004"
    
    def chunk_text(self, text: str, chunk_size: Optional[int] = None, chunk_overlap: Optional[int] = None) -> List[str]:
        """
        Split text into chunks with specified size and overlap
        """
        if chunk_size is None:
            chunk_size = settings.chunk_size
        if chunk_overlap is None:
            chunk_overlap = settings.chunk_overlap
        
        # Handle empty or very short text
        if not text or not text.strip():
            logger.warning("Empty or whitespace-only text provided for chunking")
            return []
            
        # Tokenize the text
        try:
            tokens = self.tokenizer.encode(text)
        except Exception as e:
            logger.error(f"Error tokenizing text: {str(e)}")
            # Fallback: split by sentences if tokenization fails
            sentences = text.split('.')
            return [s.strip() + '.' for s in sentences if s.strip()]
        
        if not tokens:
            logger.warning("No tokens generated from text")
            return []
            
        chunks = []
        
        for i in range(0, len(tokens), chunk_size - chunk_overlap):
            chunk_tokens = tokens[i:i + chunk_size]
            if not chunk_tokens:  # Skip empty token lists
                continue
                
            try:
                chunk_text = self.tokenizer.decode(chunk_tokens)
                if chunk_text.strip():  # Only add non-empty chunks
                    chunks.append(chunk_text.strip())
            except Exception as e:
                logger.warning(f"Error decoding chunk at position {i}: {str(e)}")
                continue
            
            # Stop if this is the last chunk
            if i + chunk_size >= len(tokens):
                break
        
        logger.info(f"Split text ({len(tokens)} tokens) into {len(chunks)} chunks")
        return chunks
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings using Google's text-embedding-004 model
        """
        try:
            embeddings = []
            
            for text in texts:
                # Skip empty chunks
                if not text.strip():
                    continue
                    
                # Generate embedding for each text chunk
                result = genai.embed_content(
                    model=self.embedding_model,
                    content=text,
                    task_type="retrieval_document"
                )
                
                # Handle different response formats
                if isinstance(result, dict) and 'embedding' in result:
                    embeddings.append(result['embedding'])
                elif hasattr(result, 'embedding'):
                    embeddings.append(result.embedding)
                else:
                    logger.warning(f"Unexpected embedding result format: {type(result)}")
                    continue
            
            logger.info(f"Generated {len(embeddings)} embeddings from {len(texts)} texts")
            return embeddings
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            raise Exception(f"Failed to generate embeddings: {str(e)}")
    
    async def store_vectors(self, file_id: str, chunks: List[str], embeddings: List[List[float]]) -> bool:
        """
        Store vectors in ChromaDB
        """
        try:
            # Ensure we have matching counts
            if len(chunks) != len(embeddings):
                logger.error(f"Mismatch: {len(chunks)} chunks vs {len(embeddings)} embeddings")
                raise Exception("Number of chunks and embeddings don't match")
            
            # Skip empty chunks and embeddings
            valid_data = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                if chunk.strip() and embedding:  # Only include non-empty chunks with valid embeddings
                    valid_data.append((i, chunk, embedding))
            
            if not valid_data:
                logger.warning(f"No valid chunks/embeddings to store for file {file_id}")
                return True
            
            # Generate unique IDs for each chunk
            ids = []
            metadatas = []
            valid_chunks = []
            valid_embeddings = []
            
            for i, chunk, embedding in valid_data:
                chunk_id = f"{file_id}_chunk_{i}"
                ids.append(chunk_id)
                valid_chunks.append(chunk)
                valid_embeddings.append(embedding)
                
                # Create metadata for each chunk
                metadatas.append({
                    "file_id": file_id,
                    "chunk_index": i,
                    "text_length": len(chunk),
                    "chunk_hash": hashlib.md5(chunk.encode()).hexdigest()
                })
            
            # Add to ChromaDB collection with proper typing
            self.collection.add(
                embeddings=valid_embeddings,  # This should be List[List[float]]
                documents=valid_chunks,
                metadatas=metadatas,
                ids=ids
            )
            
            logger.info(f"Stored {len(valid_chunks)} vectors for file {file_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing vectors for file {file_id}: {str(e)}")
            logger.error(f"Chunks count: {len(chunks)}, Embeddings count: {len(embeddings)}")
            raise Exception(f"Failed to store vectors: {str(e)}")
    
    async def process_text_to_vectors(self, file_id: str, text: str) -> bool:
        """
        Complete pipeline: chunk text, generate embeddings, store vectors
        """
        try:
            logger.info(f"Starting vector processing for file {file_id}")
            logger.info(f"Text length: {len(text)} characters")
            
            # Validate input
            if not text or not text.strip():
                logger.warning(f"Empty or whitespace-only text for file {file_id}")
                raise Exception("No text content to process")
            
            # Step 1: Chunk the text
            chunks = self.chunk_text(text)
            if not chunks:
                logger.warning(f"No valid chunks generated for file {file_id}")
                raise Exception("No valid text chunks generated")
            
            logger.info(f"Generated {len(chunks)} chunks for file {file_id}")
            
            # Step 2: Generate embeddings
            embeddings = await self.generate_embeddings(chunks)
            if not embeddings:
                logger.warning(f"No embeddings generated for file {file_id}")
                raise Exception("No embeddings generated")
            
            logger.info(f"Generated {len(embeddings)} embeddings for file {file_id}")
            
            # Step 3: Store vectors
            await self.store_vectors(file_id, chunks, embeddings)
            
            logger.info(f"Successfully completed vector processing for file {file_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error in vector processing pipeline for file {file_id}: {str(e)}")
            raise
    
    async def search_similar_documents(self, query: str, n_results: int = 5):
        """
        Search for similar documents using vector similarity
        """
        try:
            # Generate embedding for query
            query_embedding = genai.embed_content(
                model=self.embedding_model,
                content=query,
                task_type="retrieval_query"
            )
            
            # Handle different response formats
            if isinstance(query_embedding, dict) and 'embedding' in query_embedding:
                embedding = query_embedding['embedding']
            elif hasattr(query_embedding, 'embedding'):
                embedding = query_embedding.embedding
            else:
                raise Exception("Could not extract embedding from query result")
            
            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=[embedding],
                n_results=n_results
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching similar documents: {str(e)}")
            raise Exception(f"Failed to search documents: {str(e)}")
    
    async def delete_file_vectors(self, file_id: str) -> bool:
        """
        Delete all vectors for a specific file
        """
        try:
            # Get all chunk IDs for this file
            results = self.collection.get(
                where={"file_id": file_id}
            )
            
            if results['ids']:
                # Delete all chunks for this file
                self.collection.delete(ids=results['ids'])
                logger.info(f"Deleted {len(results['ids'])} vectors for file {file_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting vectors for file {file_id}: {str(e)}")
            return False

vector_processing_service = VectorProcessingService()
