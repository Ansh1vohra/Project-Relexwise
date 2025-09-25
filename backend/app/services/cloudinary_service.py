import cloudinary
import cloudinary.uploader
from app.config import settings
import logging
from typing import Optional
import aiofiles
import os
import tempfile

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
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                temp_file_path,
                folder=self.folder,
                resource_type="auto",
                public_id=f"{filename.split('.')[0]}_{os.urandom(4).hex()}",
                overwrite=False
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

cloudinary_service = CloudinaryService()
