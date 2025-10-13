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
    
    # Contract details - Updated schema to match new extraction format
    contract_name = Column(String, nullable=True)  # New field
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    vendor_name = Column(String, nullable=True)
    contract_duration = Column(String, nullable=True)  # Contract duration in years
    contract_value_local = Column(String, nullable=True)  # Contract value in local currency (number only)
    currency = Column(String, nullable=True)  # Currency code (USD, INR, EUR, etc.) - maps to Local_Currency
    contract_value_usd = Column(String, nullable=True)  # Contract value converted to USD
    contract_status = Column(String, nullable=True)  # Active, Draft, Expired
    
    # Contract type - MSA, SOW, Amendment, Agreement, Order Form, Change Request, Other
    contract_type = Column(String, nullable=True)
    
    # Scope of services - Updated to match new controlled vocabulary
    scope_of_services = Column(String, nullable=True)  # Maps to Scope_of_Work
    
    # New field for contract tag
    contract_tag = Column(String, nullable=True)  # Maps to Contract Tag
    
    # Legacy field for backward compatibility (keeping the old contract_value field)
    contract_value = Column(String, nullable=True)
    
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
