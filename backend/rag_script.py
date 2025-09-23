import os
import uuid
import chromadb # type: ignore
from llama_parse import LlamaParse, ResultType # type: ignore
from llama_index.llms.google_genai import GoogleGenAI # type: ignore
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding # type: ignore
from llama_index.core import VectorStoreIndex, Settings, StorageContext # type: ignore
from llama_index.vector_stores.chroma import ChromaVectorStore # type: ignore
from dotenv import load_dotenv # type: ignore

load_dotenv()

os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY", "")
os.environ["LLAMA_CLOUD_API_KEY"] = os.getenv("LLAMA_CLOUD_API_KEY", "")

try:
    # --- SETTINGS ---
    Settings.embed_model = GoogleGenAIEmbedding(
        model_name="text-embedding-004",
        embed_batch_size=32,
    )
    Settings.chunk_size = 1024
    Settings.chunk_overlap = 200

    # --- PERSISTENT STORAGE ---
    db = chromadb.PersistentClient(path="./chroma_db")
    collection_name = "contract_docs"
    chroma_collection = db.get_or_create_collection(collection_name)

    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    # --- PARSER ---
    parser = LlamaParse(result_type=ResultType.MD,
                        disable_ocr=False,
                        auto_mode=True,
                        auto_mode_trigger_on_image_in_page=True,
                        verbose=True)
    docs = []

    # Load PDFs only if collection is empty (avoid duplicate indexing)
    if chroma_collection.count() == 0:
        print("Database empty. Parsing and indexing documents...")
        for filename in os.listdir("./data"):
            if filename.endswith(".pdf"):
                print(f"Processing {filename}")
                file_path = os.path.join("data", filename)
                documents = parser.load_data(file_path)
                file_id = str(uuid.uuid4().hex[:8])
                # Attach meta data
                for d in documents:
                    d.metadata = {"file_id": file_id, "file_name": filename}
                docs.extend(documents)

        # Create index once with all documents
        index = VectorStoreIndex.from_documents(
            docs, storage_context=storage_context)
        print("Indexing complete.")
    else:
        print("Loading existing index from database...")
        index = VectorStoreIndex.from_vector_store(
            vector_store, storage_context=storage_context)

    # --- LLM ---
    llm = GoogleGenAI(model="models/gemini-2.5-flash", temperature=0)

    # --- QUERY ENGINE ---
    query_engine = index.as_query_engine(llm=llm, similarity_top_k=95,vector_store_query="mmr",alpha=0.5)

    # --- PROMPT ---
    prompt = """
    You are analyzing multiple PDF documents that may contain contract information.  
Read all documents carefully and extract contract details in a list of json format.  

For each file, provide the results in the following format:
{
    File Name: <file_name.pdf>  (use the file name from meta data)
    Contract Information:  
    Contract ID / Document Reference: <value or "Not found">  
    Vendor Name: <value or "Not found">  
    Type of Contract: <value or "Not found">  
    Start Date: <value (format should be Month, Day, Year) or "Not found">  
    End Date: <value (format should be Month, Day, Year) or "Not found">  
}

If no contracts are found in a file, output exactly:  
"No contracts found in <file_name.pdf>"

Guidelines:  
- Use only the information explicitly present in the document.  
- If a detail is missing, write "Not found".  
- Keep results grouped by file_name.  
- Do not merge information from different files.  
- Ensure clarity and completeness.  
    """

    # --- QUERY ---
    print("Querying for contract information across all documents...")
    response = query_engine.query(prompt)

    print("\n=== CONTRACT INFORMATION FROM ALL FILES ===")
    print(response)

except Exception as e:
    print(f"An error occurred: {e}")