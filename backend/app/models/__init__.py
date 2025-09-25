from sqlalchemy import Column, String, DateTime, Boolean, Text, Integer, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class File(Base):
    __tablename__ = "files"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    cloudinary_url = Column(String, nullable=False)
    cloudinary_public_id = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Processing flags
    vector_processing_status = Column(String, default="pending")  # pending, processing, completed, failed
    metadata_processing_status = Column(String, default="pending")  # pending, processing, completed, failed
    
    # Error tracking
    vector_processing_error = Column(Text, nullable=True)
    metadata_processing_error = Column(Text, nullable=True)
    processing_attempts = Column(Integer, default=0)
    
    # Relationships
    file_metadata = relationship("FileMetadata", back_populates="file", uselist=False)

class FileMetadata(Base):
    __tablename__ = "file_metadata"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    file_id = Column(String, ForeignKey("files.id"), nullable=False)
    
    # Contract details
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    vendor_name = Column(String, nullable=True)
    contract_value = Column(String, nullable=True)
    
    # Contract type - MSA, SOW, Amendment, Agreement, Order Form, Change Request, Other
    contract_type = Column(String, nullable=True)
    
    # Scope of services - Managed Services, Time & Material, Hardware, Software, Maintenance
    scope_of_services = Column(String, nullable=True)
    
    # Processing info
    extraction_timestamp = Column(DateTime, default=datetime.utcnow)
    raw_text_length = Column(Integer, nullable=True)
    confidence_score = Column(Float, nullable=True)
    
    # Relationships
    file = relationship("File", back_populates="file_metadata")

class ProcessingError(Base):
    __tablename__ = "processing_errors"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    file_id = Column(String, ForeignKey("files.id"), nullable=False)
    error_type = Column(String, nullable=False)  # vector_processing, metadata_extraction, file_upload
    error_message = Column(Text, nullable=False)
    error_details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)
