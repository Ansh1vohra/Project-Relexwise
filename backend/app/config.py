import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import List

load_dotenv()

class Settings(BaseSettings):
    # Database
    database_url: str = os.getenv("DATABASE_URL", "")
    
    # Cloudinary
    cloudinary_cloud_name: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    cloudinary_api_key: str = os.getenv("CLOUDINARY_API_KEY", "")
    cloudinary_api_secret: str = os.getenv("CLOUDINARY_API_SECRET", "")
    
    # LLM APIs
    llama_cloud_api_key: str = os.getenv("LLAMA_CLOUD_API_KEY", "")
    google_api_key: str = os.getenv("GOOGLE_API_KEY", "")
    
    # Processing settings
    chunk_size: int = 1024
    chunk_overlap: int = 200
    max_concurrent_processes: int = 3
    
    # ChromaDB settings
    chroma_persist_directory: str = os.getenv("CHROMA_PERSIST_DIRECTORY", "chroma_db")
    
    # File upload settings
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    allowed_extensions: List[str] = [".pdf",".docx",".doc"]
    
    class Config:
        env_file = ".env"

settings = Settings()
