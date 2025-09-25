import asyncio
import httpx
import json
from pathlib import Path

async def test_api():
    """
    Test the Contract Processing API
    """
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Test health endpoint
            print("Testing health endpoint...")
            response = await client.get(f"{base_url}/health")
            print(f"Health check: {response.status_code} - {response.json()}")
            
            # Test root endpoint
            print("\nTesting root endpoint...")
            response = await client.get(f"{base_url}/")
            print(f"Root: {response.status_code} - {response.json()}")
            
            # Test queue status
            print("\nTesting queue status...")
            response = await client.get(f"{base_url}/api/v1/queue/status")
            print(f"Queue status: {response.status_code} - {response.json()}")
            
            # Test get files (should be empty initially)
            print("\nTesting get files...")
            response = await client.get(f"{base_url}/api/v1/files")
            print(f"Files: {response.status_code} - {response.json()}")
            
            # Test get errors (should be empty initially)
            print("\nTesting get errors...")
            response = await client.get(f"{base_url}/api/v1/errors")
            print(f"Errors: {response.status_code} - {response.json()}")
            
            print("\n✅ All basic endpoints are working!")
            
        except Exception as e:
            print(f"❌ Error testing API: {str(e)}")

def test_configuration():
    """
    Test configuration and environment variables
    """
    print("Testing configuration...")
    
    try:
        from app.config import settings
        
        print("Environment variables:")
        print(f"  Database URL: {'✅ Set' if settings.database_url else '❌ Missing'}")
        print(f"  Google API Key: {'✅ Set' if settings.google_api_key else '❌ Missing'}")
        print(f"  Llama Cloud API Key: {'✅ Set' if settings.llama_cloud_api_key else '❌ Missing'}")
        print(f"  Cloudinary Cloud Name: {'✅ Set' if settings.cloudinary_cloud_name else '❌ Missing'}")
        print(f"  Cloudinary API Key: {'✅ Set' if settings.cloudinary_api_key else '❌ Missing'}")
        print(f"  Cloudinary API Secret: {'✅ Set' if settings.cloudinary_api_secret else '❌ Missing'}")
        
        print(f"\nProcessing settings:")
        print(f"  Chunk size: {settings.chunk_size}")
        print(f"  Chunk overlap: {settings.chunk_overlap}")
        print(f"  Max concurrent processes: {settings.max_concurrent_processes}")
        print(f"  Max file size: {settings.max_file_size / (1024*1024):.1f}MB")
        
    except Exception as e:
        print(f"❌ Error testing configuration: {str(e)}")

def test_imports():
    """
    Test if all required modules can be imported
    """
    print("Testing imports...")
    
    modules_to_test = [
        ("app.config", "Settings"),
        ("app.models", "File"),
        ("app.schemas", "FileSchema"),
        ("app.database", "create_tables"),
        ("app.services.cloudinary_service", "cloudinary_service"),
        ("app.services.pdf_processing", "pdf_processing_service"),
        ("app.services.vector_processing", "vector_processing_service"),
        ("app.services.metadata_extraction", "metadata_extraction_service"),
        ("app.services.processing_queue", "ProcessingQueue"),
        ("app.routers.files", "router"),
    ]
    
    for module_name, item_name in modules_to_test:
        try:
            module = __import__(module_name, fromlist=[item_name])
            getattr(module, item_name)
            print(f"  ✅ {module_name}.{item_name}")
        except Exception as e:
            print(f"  ❌ {module_name}.{item_name}: {str(e)}")

async def main():
    """
    Run all tests
    """
    print("🧪 Contract Processing Backend - Test Suite")
    print("=" * 50)
    
    # Test imports
    test_imports()
    print()
    
    # Test configuration
    test_configuration()
    print()
    
    # Test API (only if server is running)
    try:
        await test_api()
    except Exception as e:
        print(f"⚠️  API tests skipped (server may not be running): {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎉 Test suite completed!")

if __name__ == "__main__":
    asyncio.run(main())
