# Contract Processing Backend

A FastAPI-based backend for processing contract documents with PDF parsing, vector embedding, and metadata extraction.

## Features

- **Multi-file PDF upload** to Cloudinary
- **Async processing queue** for background document processing
- **PDF text extraction** using LlamaParse
- **Vector embeddings** with Google's text-embedding-004 and ChromaDB storage
- **Metadata extraction** using Google's Gemini model
- **PostgreSQL database** for storing file information and metadata
- **Comprehensive error handling** and logging

## Setup

### Prerequisites

- Python 3.8+
- PostgreSQL database
- Cloudinary account
- Google API access (for embeddings and Gemini)
- LlamaParse API access

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables in `.env`:
```env
LLAMA_CLOUD_API_KEY=your_llama_cloud_api_key
GOOGLE_API_KEY=your_google_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
DATABASE_URL=postgresql://user:password@localhost/dbname
```

### Database Setup

1. Create a PostgreSQL database
2. Update the `DATABASE_URL` in your `.env` file
3. The application will automatically create tables on startup

## Running the Application

### Development
```bash
python main.py
```
or
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Production
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### File Upload
- `POST /api/v1/upload` - Upload multiple PDF files
- `GET /api/v1/files` - List all files with processing status
- `GET /api/v1/files/{file_id}` - Get specific file details
- `GET /api/v1/files/{file_id}/status` - Get file processing status
- `GET /api/v1/files/{file_id}/metadata` - Get extracted metadata
- `DELETE /api/v1/files/{file_id}` - Delete file and all associated data

### Monitoring
- `GET /api/v1/queue/status` - Get processing queue status
- `GET /api/v1/errors` - Get processing errors
- `GET /health` - Health check endpoint

## Processing Pipeline

1. **File Upload**: PDF files are uploaded to Cloudinary and database records are created
2. **Queue Processing**: Files are added to an async processing queue
3. **Text Extraction**: PDF text is extracted using LlamaParse
4. **Vector Processing**: 
   - Text is chunked into 1024 token segments with 200 token overlap
   - Embeddings are generated using Google's text-embedding-004
   - Vectors are stored in ChromaDB
5. **Metadata Extraction**: Contract metadata is extracted using Google's Gemini model

## Extracted Metadata

For each contract, the system extracts:
- **Start Date**: Contract effective date
- **End Date**: Contract expiration date  
- **Vendor Name**: Service provider name
- **Contract Value**: Total monetary value
- **Contract Type**: MSA, SOW, Amendment, Agreement, Order Form, Change Request, or Other
- **Scope of Services**: Managed Services, Time & Material, Hardware, Software, or Maintenance

## Database Schema

### Files Table
- `id`: Unique file identifier
- `filename`: Original filename
- `cloudinary_url`: Cloudinary storage URL
- `file_size`: File size in bytes
- `vector_processing_status`: Processing status (pending/processing/completed/failed)
- `metadata_processing_status`: Processing status (pending/processing/completed/failed)
- `processing_attempts`: Number of processing attempts

### File Metadata Table
- `file_id`: Reference to files table
- `start_date`, `end_date`, `vendor_name`, `contract_value`: Extracted contract details
- `contract_type`, `scope_of_services`: Contract categorization
- `extraction_timestamp`: When metadata was extracted

### Processing Errors Table
- `file_id`: Reference to files table
- `error_type`: Type of error (vector_processing, metadata_extraction, file_upload)
- `error_message`: Error description
- `resolved`: Whether error has been resolved

## Configuration

Key configuration options in `app/config.py`:
- `chunk_size`: Text chunk size for vector processing (default: 1024)
- `chunk_overlap`: Overlap between chunks (default: 200)
- `max_concurrent_processes`: Maximum concurrent processing workers (default: 3)
- `max_file_size`: Maximum upload file size (default: 50MB)

## Logging

The application creates comprehensive logs in the `logs/` directory:
- `contract_processing.log`: General application logs
- `processing.log`: Processing-specific logs
- `errors.log`: Error logs with detailed tracebacks

## Error Handling

The system includes:
- **Retry mechanisms** for API calls
- **Queue error handling** with database logging
- **File cleanup** on processing failures
- **Comprehensive error tracking** in the database

## Development

### Project Structure
```
backend/
├── app/
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   ├── routers/         # API routes
│   ├── services/        # Business logic services
│   └── utils/           # Utilities (logging, exceptions)
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
└── .env                # Environment variables
```

### Adding New Features
1. Add new models in `app/models/`
2. Create corresponding schemas in `app/schemas/`
3. Add business logic in `app/services/`
4. Create API endpoints in `app/routers/`

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure PostgreSQL is running and credentials are correct
2. **API Keys**: Verify all API keys are valid and have proper permissions
3. **File Size**: Check file size limits if uploads are failing
4. **Processing Stuck**: Check queue status and worker health

### Monitoring
- Use `/api/v1/queue/status` to monitor processing queue
- Check `/api/v1/errors` for any processing failures
- Monitor logs in the `logs/` directory
