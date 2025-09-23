import os
import uuid
from typing import List
from llama_parse import LlamaParse, ResultType
from llama_index.core import VectorStoreIndex, Settings, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding

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

parser = LlamaParse(
    result_type=ResultType.MD,
    disable_ocr=False,
    auto_mode=True,
    auto_mode_trigger_on_image_in_page=True,
    verbose=True
)

def upload_pdfs(file_paths: List[str]):
    """
    Upload and index a list of PDF files into Chroma.
    """
    try:
        docs = []

        # Load and prepare documents
        for file_path in file_paths:
            filename = os.path.basename(file_path)
            print(f"Processing {filename}...")
            documents = parser.load_data(file_path)
            file_id = str(uuid.uuid4().hex[:8])
            for d in documents:
                d.metadata = {"file_id": file_id, "file_name": filename}
            docs.extend(documents)

        if docs:
            VectorStoreIndex.from_documents(docs, storage_context=storage_context)

            return {"status": "success", "message": f"{len(file_paths)} file(s) uploaded and indexed."}

        else:
            return {"status": "empty", "message": "No valid PDF files to upload."}

    except Exception as e:
        return {"status": "error", "message": f"An error occurred while uploading: {str(e)}"}