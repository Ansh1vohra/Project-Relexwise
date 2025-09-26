import asyncio
from llama_parse import LlamaParse, ResultType
from app.config import settings
import logging
import tempfile
import os
from typing import Optional

logger = logging.getLogger(__name__)

class PDFProcessingService:
    def __init__(self):
        # self.parser = LlamaParse(
        #     api_key=settings.llama_cloud_api_key,
        #     result_type=ResultType.TXT,  # Use proper enum value
        #     verbose=True,
        #     language="en"
        # )
        # self.parser = LlamaParse(
        #     api_key=settings.llama_cloud_api_key,
        #     result_type=ResultType.MD,
        #     disable_ocr=False,
        #     auto_mode=True,
        #     auto_mode_trigger_on_image_in_page=True,
        #     verbose=True,
        #     language="en"
        # )
        pass
    
    async def extract_text_from_pdf(self, file_content: bytes, filename: str) -> str:
        """
        Extract text from PDF using LlamaParse with proper error handling
        """
        temp_file_path = None
        try:
            # Validate input
            if not file_content:
                raise Exception("Empty file content provided")
            
            # Create temporary file for PDF processing
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
                temp_file.write(file_content)
                temp_file_path = temp_file.name
            
            # Verify file was written correctly
            if not os.path.exists(temp_file_path):
                raise Exception("Temporary file was not created successfully")
            
            file_size = os.path.getsize(temp_file_path)
            logger.info(f"Starting PDF text extraction for {filename} ({file_size} bytes)")
            
            if file_size == 0:
                raise Exception("PDF file is empty or corrupted")
            
            # Use proper async handling with retries
            documents = await self._parse_with_retries(temp_file_path, filename)
            
            if not documents:
                raise Exception("No documents returned from LlamaParse")
            
            logger.info(f"LlamaParse returned {len(documents)} documents for {filename}")
            
            # Combine all document text
            full_text = ""
            for i, doc in enumerate(documents):
                doc_text = ""
                try:
                    # Handle different response formats
                    if hasattr(doc, 'text') and doc.text:
                        doc_text = doc.text
                    elif hasattr(doc, 'get_content'):
                        content = doc.get_content()
                        if content:
                            doc_text = content
                    elif hasattr(doc, 'page_content'):
                        page_content = getattr(doc, 'page_content', None)
                        if page_content:
                            doc_text = page_content
                    elif isinstance(doc, dict) and 'text' in doc:
                        doc_text = doc['text']
                    elif isinstance(doc, str) and doc.strip():
                        doc_text = doc
                    else:
                        # Fallback - try to convert to string
                        doc_str = str(doc)
                        if doc_str and doc_str != "None":
                            doc_text = doc_str
                    
                    if doc_text:
                        full_text += doc_text + "\n"
                        logger.info(f"Document {i+1}: {len(doc_text)} characters")
                    else:
                        logger.warning(f"Document {i+1}: No text content found")
                        
                except Exception as doc_error:
                    logger.warning(f"Error processing document {i+1} for {filename}: {str(doc_error)}")
                    continue
            
            # Clean up temporary file
            if temp_file_path and os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            
            # Validate extracted text
            if not full_text.strip():
                raise Exception("No text content could be extracted from PDF")
            
            logger.info(f"Successfully extracted text from {filename}. Total length: {len(full_text)} characters")
            return full_text.strip()
            
        except Exception as e:
            # Clean up temporary file in case of error
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except Exception as cleanup_error:
                    logger.warning(f"Failed to cleanup temp file: {cleanup_error}")
            
            error_msg = f"Failed to extract text from PDF: {str(e)}"
            logger.error(f"Error extracting text from {filename}: {error_msg}")
            raise Exception(error_msg)
    
    async def _parse_with_retries(self, file_path: str, filename: str, max_retries: int = 3):
        """
        Parse PDF with retry logic to handle LlamaParse issues
        """
        for attempt in range(max_retries):
            try:
                logger.info(f"Parsing attempt {attempt + 1}/{max_retries} for {filename}")
                
                # Add a small delay before each attempt
                if attempt > 0:
                    wait_time = 2 ** (attempt - 1)  # Exponential backoff
                    logger.info(f"Waiting {wait_time} seconds before retry...")
                    await asyncio.sleep(wait_time)
                
                # Run in executor to avoid blocking
                loop = asyncio.get_event_loop()
                documents = await loop.run_in_executor(
                    None, 
                    self._blocking_parse, 
                    file_path
                )
                
                if documents:
                    logger.info(f"Successfully parsed {filename} on attempt {attempt + 1}")
                    return documents
                else:
                    logger.warning(f"No documents returned on attempt {attempt + 1} for {filename}")
                    
            except Exception as e:
                logger.warning(f"Parse attempt {attempt + 1} failed for {filename}: {str(e)}")
                if attempt == max_retries - 1:  # Last attempt
                    raise e
        
        raise Exception(f"All {max_retries} parsing attempts failed")
    
    def _blocking_parse(self, file_path: str):
        """
        Blocking parse method for executor with better error handling
        """
        try:
            # Add a small delay to ensure file is ready
            import time
            time.sleep(0.5)
            
            # Verify file exists and is readable
            if not os.path.exists(file_path):
                raise Exception(f"File does not exist: {file_path}")
            
            file_size = os.path.getsize(file_path)
            if file_size == 0:
                raise Exception("File is empty")
            
            logger.info(f"Parsing file: {file_path} ({file_size} bytes)")
            
            # Create a fresh parser instance for this sync operation
            # This avoids event loop conflicts
            from llama_parse import LlamaParse, ResultType
            from app.config import settings
            sync_parser = LlamaParse(
                api_key=settings.llama_cloud_api_key,
                result_type=ResultType.MD,
                disable_ocr=False,
                auto_mode=True,
                auto_mode_trigger_on_image_in_page=True,
                verbose=True,
                language="en"
        )

            # Use load_data method with error handling
            documents = sync_parser.load_data(file_path)
            
            # Validate the result
            if documents is None:
                logger.warning("Parser returned None")
                return []
            
            if not isinstance(documents, list):
                logger.info("Parser returned single document, converting to list")
                documents = [documents]
            
            logger.info(f"Parser returned {len(documents)} documents")
            return documents
            
        except Exception as e:
            logger.error(f"Blocking parse failed: {str(e)}")
            raise
    
    def _parse_sync(self, file_path: str):
        """Synchronous parsing method for executor (legacy)"""
        return self._blocking_parse(file_path)

pdf_processing_service = PDFProcessingService()
