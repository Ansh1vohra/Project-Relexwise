import cloudinary
import cloudinary.uploader
from app.config import settings
import logging
from typing import Optional
import aiofiles
import os
import tempfile
import re

logger = logging.getLogger(__name__)

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret
)

class CloudinaryService:
    def __init__(self):
        self.folder = "contracts"  # Cloudinary folder for contracts
    
    def _sanitize_filename(self, filename: str) -> str:
        """
        Sanitize filename for use as Cloudinary public_id
        - Remove file extension
        - Replace spaces with underscores
        - Remove special characters except underscores and hyphens
        - Convert to lowercase
        - Limit length to avoid issues
        """
        # Remove extension
        name_without_ext = filename.rsplit('.', 1)[0]
        
        # Replace spaces with underscores
        sanitized = name_without_ext.replace(' ', '_')
        
        # Remove special characters, keep only alphanumeric, underscores, and hyphens
        sanitized = re.sub(r'[^a-zA-Z0-9_-]', '', sanitized)
        
        # Convert to lowercase
        sanitized = sanitized.lower()
        
        # Remove multiple consecutive underscores
        sanitized = re.sub(r'_+', '_', sanitized)
        
        # Remove leading/trailing underscores
        sanitized = sanitized.strip('_')
        
        # Limit length to 100 characters (Cloudinary limit is higher but this is safe)
        if len(sanitized) > 100:
            sanitized = sanitized[:100]
        
        # Ensure it's not empty
        if not sanitized:
            sanitized = "document"
            
        return sanitized
    
    async def upload_file(self, file_content: bytes, filename: str) -> dict:
        """
        Upload file to Cloudinary
        Returns dict with public_id and secure_url
        """
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{filename}") as temp_file:
                temp_file.write(file_content)
                temp_file_path = temp_file.name
            
            # Sanitize filename for public_id
            sanitized_name = self._sanitize_filename(filename)
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                temp_file_path,
                folder=self.folder,
                resource_type="raw",  # Use 'raw' for PDFs to ensure proper handling
                public_id=f"{sanitized_name}_{os.urandom(4).hex()}",
                overwrite=False,
                flags="attachment"  # This ensures the PDF opens properly in browser
            )
            
            # Clean up temporary file
            os.unlink(temp_file_path)
            
            logger.info(f"Successfully uploaded {filename} to Cloudinary: {result['public_id']}")
            return {
                "public_id": result["public_id"],
                "secure_url": result["secure_url"],
                "format": result.get("format", ""),
                "bytes": result.get("bytes", 0)
            }
            
        except Exception as e:
            # Clean up temporary file in case of error
            if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            
            logger.error(f"Error uploading {filename} to Cloudinary: {str(e)}")
            raise Exception(f"Failed to upload file to Cloudinary: {str(e)}")
    
    async def delete_file(self, public_id: str) -> bool:
        """
        Delete file from Cloudinary
        """
        try:
            result = cloudinary.uploader.destroy(public_id)
            if result.get("result") == "ok":
                logger.info(f"Successfully deleted {public_id} from Cloudinary")
                return True
            else:
                logger.warning(f"Failed to delete {public_id} from Cloudinary: {result}")
                return False
        except Exception as e:
            logger.error(f"Error deleting {public_id} from Cloudinary: {str(e)}")
            return False
    
    def get_pdf_view_url(self, public_id: str) -> str:
        """
        Generate a URL for viewing PDF in browser
        """
        try:
            # Generate URL with proper flags for PDF viewing
            url = cloudinary.utils.cloudinary_url(
                public_id,
                resource_type="raw",
                flags="attachment",
                secure=True
            )[0]
            return url
        except Exception as e:
            logger.error(f"Error generating PDF view URL for {public_id}: {str(e)}")
            return ""
    
    def get_pdf_download_url(self, public_id: str, filename: str) -> str:
        """
        Generate a URL for downloading PDF with proper filename
        """
        try:
            # Generate URL with download flag and filename
            url = cloudinary.utils.cloudinary_url(
                public_id,
                resource_type="raw",
                flags=f"attachment:{filename}",
                secure=True
            )[0]
            return url
        except Exception as e:
            logger.error(f"Error generating PDF download URL for {public_id}: {str(e)}")
            return ""

cloudinary_service = CloudinaryService()
