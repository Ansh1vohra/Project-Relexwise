import asyncio
import os
import uuid
from typing import List
import multiprocessing as mp
from llama_parse import LlamaParse, ResultType # type: ignore
from llama_index.core import VectorStoreIndex, Settings, StorageContext # type: ignore
from llama_index.vector_stores.chroma import ChromaVectorStore # type: ignore
import chromadb # type: ignore
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding # type: ignore
import logging

logger = logging.getLogger(__name__)

# --- SETTINGS ---
Settings.embed_model = GoogleGenAIEmbedding(model_name="text-embedding-004", embed_batch_size=32)
Settings.chunk_size = 1024
Settings.chunk_overlap = 200

# --- PERSISTENT STORAGE ---
db = chromadb.PersistentClient(path="./chroma2_db")
collection_name = "contract_docs"
chroma_collection = db.get_or_create_collection(collection_name)
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

def parse_single_pdf(file_path: str):
    """
    Parse a single PDF file in a separate process to avoid event loop conflicts.
    This function runs in a completely isolated process.
    """
    try:
        # Create a new parser instance in this process
        parser = LlamaParse(
            result_type=ResultType.MD,
            disable_ocr=False,
            auto_mode=True,
            auto_mode_trigger_on_image_in_page=True,
            verbose=True
        )
        
        filename = os.path.basename(file_path)
        print(f"Processing {filename}...")
        
        documents = parser.load_data(file_path)
        file_id = str(uuid.uuid4().hex[:8])
        
        # Prepare document data for return (can't return Document objects directly)
        doc_data = []
        for d in documents:
            doc_data.append({
                'text': d.text,
                'metadata': {"file_id": file_id, "file_name": filename}
            })
        
        print(f"Successfully processed {filename}")
        return {"success": True, "documents": doc_data, "filename": filename}
        
    except Exception as e:
        print(f"Error processing {os.path.basename(file_path)}: {str(e)}")
        return {"success": False, "error": str(e), "filename": os.path.basename(file_path)}

async def async_upload_pdfs(file_paths: List[str]):
    """
    Async version of upload_pdfs that uses multiprocessing to avoid event loop conflicts
    """
    try:
        # Use multiprocessing to parse PDFs in separate processes
        loop = asyncio.get_event_loop()
        
        # Create a process pool
        with mp.Pool(processes=min(len(file_paths), mp.cpu_count())) as pool:
            # Submit all parsing tasks
            parse_results = await loop.run_in_executor(
                None, 
                lambda: pool.map(parse_single_pdf, file_paths)
            )
        
        # Process the results
        all_docs = []
        successful_files = []
        failed_files = []
        
        for result in parse_results:
            if result["success"]:
                # Convert back to Document objects
                from llama_index.core import Document
                for doc_data in result["documents"]:
                    doc = Document(
                        text=doc_data["text"],
                        metadata=doc_data["metadata"]
                    )
                    all_docs.append(doc)
                successful_files.append(result["filename"])
            else:
                failed_files.append(f"{result['filename']}: {result['error']}")
                logger.error(f"Failed to process {result['filename']}: {result['error']}")

        # Create index if we have documents
        if all_docs:
            await loop.run_in_executor(
                None, VectorStoreIndex.from_documents, all_docs, storage_context
            )
            
            message = f"{len(successful_files)} file(s) uploaded and indexed successfully."
            if failed_files:
                message += f" Failed files: {'; '.join(failed_files)}"
            
            return {
                "status": "success", 
                "message": message,
                "successful_files": successful_files,
                "failed_files": failed_files
            }
        else:
            return {
                "status": "error", 
                "message": f"No files processed successfully. Errors: {'; '.join(failed_files)}"
            }

    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return {"status": "error", "message": f"An error occurred while uploading: {str(e)}"}

def upload_pdfs(file_paths: List[str]):
    """
    Synchronous wrapper for backward compatibility
    """
    try:
        # Create a new event loop for this thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            return loop.run_until_complete(async_upload_pdfs(file_paths))
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Sync upload error: {str(e)}")
        return {"status": "error", "message": f"An error occurred while uploading: {str(e)}"}
