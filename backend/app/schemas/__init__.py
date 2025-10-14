from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ContractStatus(str, Enum):
    ACTIVE = "Active"
    DRAFT = "Draft"
    EXPIRED = "Expired"
    NA = "NA"

class ContractType(str, Enum):
    MSA = "MSA"
    SOW = "SOW"
    AMENDMENT = "Amendment"
    AGREEMENT = "Agreement"
    ORDER_FORM = "Order Form"
    CHANGE_REQUEST = "Change Request"
    OTHER = "Other"
    NA = "NA"

class ScopeOfServices(str, Enum):
    MANAGED_SERVICES = "Managed Services"
    TIME_MATERIAL = "Time & Material"
    HARDWARE = "Hardware"
    SOFTWARE = "Software"
    MAINTENANCE = "Maintenance"
    OTHER = "Other"
    NA = "NA"

class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    cloudinary_url: str
    message: str

class FileMetadataSchema(BaseModel):
    id: str
    file_id: str
    contract_name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    vendor_name: Optional[str] = None
    contract_duration: Optional[str] = None
    contract_value_local: Optional[str] = None
    currency: Optional[str] = None
    contract_value_usd: Optional[str] = None
    contract_status: Optional[str] = None
    contract_type: Optional[str] = None
    scope_of_services: Optional[str] = None
    contract_tag: Optional[str] = None
    contract_value: Optional[str] = None  # Legacy field for backward compatibility
    
    # Commercial terms fields
    auto_renewal: Optional[str] = None
    payment_terms: Optional[str] = None
    liability_cap: Optional[str] = None
    termination_for_convenience: Optional[str] = None
    price_escalation: Optional[str] = None
    
    # Risk scoring fields
    auto_renewal_risk_score: Optional[int] = None
    payment_terms_risk_score: Optional[int] = None
    liability_cap_risk_score: Optional[int] = None
    termination_risk_score: Optional[int] = None
    price_escalation_risk_score: Optional[int] = None
    total_risk_score: Optional[float] = None
    risk_band: Optional[str] = None
    risk_color: Optional[str] = None
    
    extraction_timestamp: datetime
    raw_text_length: Optional[int] = None
    confidence_score: Optional[float] = None
    
    class Config:
        from_attributes = True

class FileSchema(BaseModel):
    id: str
    filename: str
    cloudinary_url: str
    cloudinary_public_id: str
    file_size: int
    upload_timestamp: datetime
    vector_processing_status: ProcessingStatus
    metadata_processing_status: ProcessingStatus
    vector_processing_error: Optional[str] = None
    metadata_processing_error: Optional[str] = None
    processing_attempts: int
    
    class Config:
        from_attributes = True

class FileWithMetadataSchema(BaseModel):
    id: str
    filename: str
    cloudinary_url: str
    cloudinary_public_id: str
    file_size: int
    upload_timestamp: datetime
    vector_processing_status: ProcessingStatus
    metadata_processing_status: ProcessingStatus
    vector_processing_error: Optional[str] = None
    metadata_processing_error: Optional[str] = None
    processing_attempts: int
    file_metadata: Optional[FileMetadataSchema] = None
    
    class Config:
        from_attributes = True

class FileStatusResponse(BaseModel):
    file_id: str
    filename: str
    vector_processing_status: ProcessingStatus
    metadata_processing_status: ProcessingStatus
    processing_attempts: int
    errors: List[str] = []

class ProcessingErrorSchema(BaseModel):
    id: str
    file_id: str
    error_type: str
    error_message: str
    error_details: Optional[str] = None
    timestamp: datetime
    resolved: bool
    
    class Config:
        from_attributes = True

class BulkUploadResponse(BaseModel):
    uploaded_files: List[FileUploadResponse]
    failed_uploads: List[dict]
    total_files: int
    successful_uploads: int
    failed_uploads_count: int

# Vector Search Schemas
class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="Search query")
    file_ids: Optional[List[str]] = Field(None, description="Optional list of file IDs to search within")
    top_k: int = Field(5, ge=1, le=50, description="Number of top results to return")

class SearchResult(BaseModel):
    rank: int
    content: str
    similarity_score: float
    file_id: str
    filename: str
    chunk_index: int
    metadata: dict

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total_results: int
    search_time_ms: Optional[float] = None
    
class CollectionStats(BaseModel):
    total_chunks: int
    unique_files: int
    collection_name: str
    error: Optional[str] = None
