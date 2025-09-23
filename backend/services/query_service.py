import json
import re
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.llms.google_genai import GoogleGenAI
import chromadb

# Persistent storage
db = chromadb.PersistentClient(path="./chroma_db")
collection_name = "contract_docs"
chroma_collection = db.get_or_create_collection(collection_name)
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

# Load index and LLM once at module load
index = None
if chroma_collection.count() > 0:
    index = VectorStoreIndex.from_vector_store(vector_store, storage_context=storage_context)

llm = GoogleGenAI(model="models/gemini-2.5-flash", temperature=0)


def query_contracts(prompt: str):
    """
    Query the indexed documents for contract information.
    Cleans the response so that a valid JSON object is returned.
    """
    if index is None:
        return {"status": "error", "message": "No documents indexed. Please upload PDFs first."}

    try:

        query_engine = index.as_query_engine(llm=llm,similarity_top_k=95 ,vector_store_query="mmr",alpha=0.5)
        response = query_engine.query(prompt)
        response_str = str(response)

        # Remove ```json ... ``` or ``` ... ``` code blocks
        cleaned_str = re.sub(r"```(?:json)?\n(.*?)```", r"\1", response_str, flags=re.DOTALL).strip()

        # Try to parse as JSON
        try:
            data_json = json.loads(cleaned_str)
        except json.JSONDecodeError:
            # Fallback: return as a string if parsing fails
            data_json = {"raw_response": cleaned_str}

        return {"status": "success", "data": data_json}

    except Exception as e:
        return {"status": "error", "message": f"An error occurred during querying: {e}"}