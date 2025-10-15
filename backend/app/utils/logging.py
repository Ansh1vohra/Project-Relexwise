import logging
import sys
from logging.handlers import RotatingFileHandler
import os

def setup_logging():
    """
    Configure logging for the application
    """
    # Create logs directory if it doesn't exist
    logs_dir = "logs"
    if not os.path.exists(logs_dir):
        os.makedirs(logs_dir)
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            # Console handler
            logging.StreamHandler(sys.stdout),
            # File handler with rotation
            RotatingFileHandler(
                os.path.join(logs_dir, 'contract_processing.log'),
                maxBytes=10*1024*1024,  # 10MB
                backupCount=5
            )
        ]
    )
    
    # Set specific log levels for different modules
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("chromadb").setLevel(logging.WARNING)
    
    # Create separate loggers for different components
    setup_component_loggers()

def setup_component_loggers():
    """
    Setup specialized loggers for different components
    """
    # Processing logger
    processing_logger = logging.getLogger("processing")
    processing_handler = RotatingFileHandler(
        "logs/processing.log",
        maxBytes=10*1024*1024,
        backupCount=3
    )
    processing_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    )
    processing_logger.addHandler(processing_handler)
    
    # Error logger
    error_logger = logging.getLogger("errors")
    error_handler = RotatingFileHandler(
        "logs/errors.log",
        maxBytes=10*1024*1024,
        backupCount=5
    )
    error_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s - %(pathname)s:%(lineno)d')
    )
    error_logger.addHandler(error_handler)
    error_logger.setLevel(logging.ERROR)

class LoggingMiddleware:
    """
    Middleware for logging requests and responses
    """
    def __init__(self, app):
        self.app = app
        self.logger = logging.getLogger("api")
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Log request
            self.logger.info(f"Request: {scope['method']} {scope['path']}")
        
        await self.app(scope, receive, send)
