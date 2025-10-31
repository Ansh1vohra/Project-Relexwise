import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import AsyncSessionLocal
from app.models import File, FileMetadata, ProcessingError
from app.services.cloudinary_service import cloudinary_service
from app.services.pdf_processing import pdf_processing_service
from app.services.vector_processing_friend import friend_vector_processing_service
from app.services.metadata_extraction import metadata_extraction_service
from app.config import settings
from app.websocket import manager
import uuid

logger = logging.getLogger(__name__)

class ProcessingQueue:
    def __init__(self):
        self.queue: asyncio.Queue = asyncio.Queue()
        self.workers: List[asyncio.Task] = []
        self.is_running = False
        self.max_concurrent_workers = settings.max_concurrent_processes
    
    async def start(self):
        """Start the processing queue workers"""
        if self.is_running:
            return
        
        self.is_running = True
        logger.info(f"Starting {self.max_concurrent_workers} processing workers")
        
        # Create worker tasks
        for i in range(self.max_concurrent_workers):
            worker = asyncio.create_task(self._worker(f"worker-{i}"))
            self.workers.append(worker)
    
    async def stop(self):
        """Stop the processing queue workers"""
        if not self.is_running:
            return
        
        self.is_running = False
        logger.info("Stopping processing workers")
        
        # Cancel all workers
        for worker in self.workers:
            worker.cancel()
        
        # Wait for all workers to finish
        await asyncio.gather(*self.workers, return_exceptions=True)
        self.workers.clear()
    
    def _safe_int_convert(self, value):
        """Safely convert a value to integer"""
        if value is None or value == "" or value == "N/A":
            return None
        try:
            return int(value) if isinstance(value, str) else value
        except (ValueError, TypeError):
            return None
    
    def _safe_float_convert(self, value):
        """Safely convert a value to float"""
        if value is None or value == "" or value == "N/A":
            return None
        try:
            return float(value) if isinstance(value, str) else value
        except (ValueError, TypeError):
            return None
    
    def _calculate_risk_band(self, risk_score):
        """Calculate risk band based on risk score"""
        if risk_score is None:
            return None
        if risk_score <= 0.67:
            return "Low"
        elif risk_score <= 1.33:
            return "Medium"
        else:
            return "High"
    
    def _calculate_risk_color(self, risk_score):
        """Calculate risk color based on risk score"""
        if risk_score is None:
            return None
        if risk_score <= 0.67:
            return "green"
        elif risk_score <= 1.33:
            return "yellow"
        else:
            return "red"
    
    async def add_file_for_processing(self, file_id: str, file_content: bytes, filename: str, user_id: str = None, tenant_id: str = None):
        """Add a file to the processing queue"""
        task = {
            "file_id": file_id,
            "file_content": file_content,
            "filename": filename,
            "timestamp": datetime.utcnow(),
            "user_id": user_id,
            "tenant_id": tenant_id,
        }
        await self.queue.put(task)
        logger.info(f"Added file {filename} ({file_id}) to processing queue with user_id: {user_id}, tenant_id: {tenant_id}")
    
    async def _worker(self, worker_name: str):
        """Worker process to handle file processing"""
        logger.info(f"Started worker: {worker_name}")
        
        while self.is_running:
            try:
                # Get task from queue with timeout
                task = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                
                file_id = task["file_id"]
                file_content = task["file_content"]
                filename = task["filename"]
                user_id = task["user_id"]
                tennant_id = task["tenant_id"]
                
                logger.info(f"{worker_name} processing file: {filename} ({file_id})")
                
                # Process the file with retry logic
                max_retries = 3
                for attempt in range(1, max_retries + 1):
                    try:
                        await self._process_file(file_id, file_content, filename, worker_name,user_id, tennant_id)
                        break  # Success, exit retry loop
                    except Exception as e:
                        logger.error(f"{worker_name} error processing {filename} (attempt {attempt}): {str(e)}")
                        if attempt < max_retries:
                            await asyncio.sleep(5)  # Wait before retry
                        else:
                            logger.error(f"{worker_name} failed to process {filename} after {max_retries} attempts.")
                            # Mark as failed in DB (already handled in _process_file)
                            break
                # Mark task as done
                self.queue.task_done()
                
            except asyncio.TimeoutError:
                # Continue loop if no task available
                continue
            except asyncio.CancelledError:
                # Worker cancelled
                break
            except Exception as e:
                logger.error(f"{worker_name} error processing task: {str(e)}")
                # Mark task as done even if it failed
                self.queue.task_done()
        
        logger.info(f"Stopped worker: {worker_name}")
    
    async def _process_file(self, file_id: str, file_content: bytes, filename: str, worker_name: str,user_id, tenant_id):
        """Process a single file - PDF extraction, vector processing, and metadata extraction"""
        async with AsyncSessionLocal() as db:
            try:
                # Update processing attempts
                await self._increment_processing_attempts(db, file_id)
                
                # Step 1: Extract text from PDF
                logger.info(f"{worker_name} extracting text from {filename}")
                await self._update_processing_status(db, file_id, "vector_processing_status", "processing")
                
                extracted_text = await pdf_processing_service.extract_text_from_pdf(file_content, filename)
                logger.info(f"{worker_name} extracted {len(extracted_text)} characters from {filename}")
                
                # Step 2: Process vectors (chunking, embedding, storing)
                logger.info(f"{worker_name} processing vectors for {filename}")
                await friend_vector_processing_service.process_text_to_vectors(file_id, extracted_text, user_id, tenant_id)
                
                # Mark vector processing as completed
                await self._update_processing_status(db, file_id, "vector_processing_status", "completed")
                logger.info(f"{worker_name} completed vector processing for {filename}")
                
                # Send WebSocket notification for vector processing completion
                try:
                    await manager.notify_vector_processing_complete(file_id)
                    await manager.notify_file_processing_update(
                        file_id=file_id,
                        status="vector_completed"
                    )
                except Exception as ws_error:
                    logger.warning(f"Failed to send WebSocket notification for vector completion {file_id}: {ws_error}")
                
                # Step 3: Extract metadata
                logger.info(f"{worker_name} extracting metadata from {filename}")
                await self._update_processing_status(db, file_id, "metadata_processing_status", "processing")
                
                # Create temporary file for metadata classification
                temp_file_path = None
                try:
                    import tempfile
                    import os
                    
                    # Create temporary file with original content
                    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{filename}") as temp_file:
                        temp_file.write(file_content)
                        temp_file_path = temp_file.name
                    
                    logger.info(f"{worker_name} created temporary file for classification: {temp_file_path}")
                    
                    # Extract metadata with file path for classification
                    metadata = await metadata_extraction_service.extract_metadata(extracted_text, file_id, temp_file_path)
                    
                finally:
                    # Clean up temporary file
                    if temp_file_path and os.path.exists(temp_file_path):
                        os.unlink(temp_file_path)
                        logger.info(f"{worker_name} cleaned up temporary file: {temp_file_path}")
                
                # Store metadata in database
                await self._store_metadata(db, file_id, metadata, len(extracted_text))
                
                # Mark metadata processing as completed
                await self._update_processing_status(db, file_id, "metadata_processing_status", "completed")
                logger.info(f"{worker_name} completed metadata extraction for {filename}")
                
                # Send WebSocket notification for metadata extraction completion
                try:
                    await manager.notify_metadata_extracted(file_id, metadata)
                    await manager.notify_file_processing_update(
                        file_id=file_id,
                        status="metadata_completed",
                        metadata=metadata
                    )
                except Exception as ws_error:
                    logger.warning(f"Failed to send WebSocket notification for {file_id}: {ws_error}")
                
                # Commit all changes
                await db.commit()
                logger.info(f"{worker_name} successfully processed {filename} ({file_id})")
                
            except Exception as e:
                await db.rollback()
                error_message = f"Error processing file {filename}: {str(e)}"
                logger.error(f"{worker_name} {error_message}")
                
                # Log error to database
                await self._log_processing_error(db, file_id, "processing", error_message, str(e))
                
                # Mark processing as failed
                await self._update_processing_status(db, file_id, "vector_processing_status", "failed")
                await self._update_processing_status(db, file_id, "metadata_processing_status", "failed")
                await self._update_processing_error(db, file_id, "vector_processing_error", error_message)
                await self._update_processing_error(db, file_id, "metadata_processing_error", error_message)
                
                await db.commit()
    
    async def _increment_processing_attempts(self, db: AsyncSession, file_id: str):
        """Increment processing attempts counter"""
        stmt = update(File).where(File.id == file_id).values(
            processing_attempts=File.processing_attempts + 1
        )
        await db.execute(stmt)
    
    async def _update_processing_status(self, db: AsyncSession, file_id: str, status_field: str, status: str):
        """Update processing status in database"""
        stmt = update(File).where(File.id == file_id).values(**{status_field: status})
        await db.execute(stmt)
    
    async def _update_processing_error(self, db: AsyncSession, file_id: str, error_field: str, error_message: str):
        """Update processing error in database"""
        stmt = update(File).where(File.id == file_id).values(**{error_field: error_message})
        await db.execute(stmt)
    
    async def _store_metadata(self, db: AsyncSession, file_id: str, metadata: Dict, text_length: int):
        """Store extracted metadata in database"""
        db_metadata = FileMetadata(
            id=str(uuid.uuid4()),
            file_id=file_id,
            contract_name=metadata.get("contract_name"),
            start_date=metadata.get("start_date"),
            end_date=metadata.get("end_date"),
            vendor_name=metadata.get("vendor_name"),
            contract_duration=metadata.get("contract_duration"),
            contract_value_local=metadata.get("contract_value_local"),
            currency=metadata.get("currency"),
            contract_value_usd=metadata.get("contract_value_usd"),
            contract_status=metadata.get("contract_status"),
            contract_type=metadata.get("contract_type"),
            scope_of_services=metadata.get("scope_of_services"),
            contract_tag=metadata.get("contract_tag"),
            contract_value=metadata.get("contract_value"),  # Legacy field for backward compatibility
            
            # Commercial terms - these were missing!
            auto_renewal=metadata.get("auto_renewal"),
            payment_terms=metadata.get("payment_terms"),
            liability_cap=metadata.get("liability_cap"),
            termination_for_convenience=metadata.get("termination_for_convenience"),
            price_escalation=metadata.get("price_escalation"),
            
            # Risk scores - these were also missing!
            auto_renewal_risk_score=self._safe_int_convert(metadata.get("auto_renewal_risk_score")),
            payment_terms_risk_score=self._safe_int_convert(metadata.get("payment_terms_risk_score")),
            liability_cap_risk_score=self._safe_int_convert(metadata.get("liability_cap_risk_score")),
            termination_risk_score=self._safe_int_convert(metadata.get("termination_convenience_risk_score")),  # Field name mapping
            price_escalation_risk_score=self._safe_int_convert(metadata.get("price_escalation_risk_score")),
            total_risk_score=self._safe_float_convert(metadata.get("overall_risk_score")),  # Field name mapping
            risk_band=self._calculate_risk_band(self._safe_float_convert(metadata.get("overall_risk_score"))),
            risk_color=self._calculate_risk_color(self._safe_float_convert(metadata.get("overall_risk_score"))),
            
            # Additional fields
            raw_text_length=text_length,
            extraction_timestamp=datetime.utcnow(),
            confidence_score=0.95  # Set a default confidence score
        )
        db.add(db_metadata)
        
        logger.info(f"Stored metadata including commercial terms for file {file_id}: "
                   f"Auto-renewal: {metadata.get('auto_renewal')}, "
                   f"Payment terms: {metadata.get('payment_terms')}, "
                   f"Liability cap: {metadata.get('liability_cap')}, "
                   f"Overall risk score: {metadata.get('overall_risk_score')}")
    
    async def _log_processing_error(self, db: AsyncSession, file_id: str, error_type: str, error_message: str, error_details: str):
        """Log processing error to database"""
        error_record = ProcessingError(
            id=str(uuid.uuid4()),
            file_id=file_id,
            error_type=error_type,
            error_message=error_message,
            error_details=error_details,
            timestamp=datetime.utcnow(),
            resolved=False
        )
        db.add(error_record)
    
    async def get_queue_status(self) -> Dict:
        """Get current queue status"""
        return {
            "is_running": self.is_running,
            "queue_size": self.queue.qsize(),
            "active_workers": len([w for w in self.workers if not w.done()]),
            "total_workers": len(self.workers)
        }
