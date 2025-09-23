import os
import shutil
from typing import List
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from constants import PROMPT,UPLOAD_DIR

load_dotenv(dotenv_path=".env")

os.environ["LLAMA_CLOUD_API_KEY"] = os.getenv("LLAMA_CLOUD_API_KEY")
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

from services.upload_service import upload_pdfs
from services.query_service import query_contracts  

# --- FASTAPI APP ---
app = FastAPI(title="Contract PDF Service")

os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload-contracts")
async def upload_endpoint(files: List[UploadFile] = File(...)):
    """
    Endpoint to upload and index PDF files.
    """
    print("Received upload request...")
    try:
        file_paths = []
        for file in files:
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as f:
                shutil.copyfileobj(file.file, f)
            file_paths.append(file_path)

        result = upload_pdfs(file_paths)
        return JSONResponse(content=result)

    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.get("/query-contracts")
async def query_endpoint():
    """
    Endpoint to query indexed PDFs for contract information.
    """
    try:
        result = query_contracts(prompt=PROMPT)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})
    
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "contract-rag"}

@app.get("/")
async def root():
    return {"message": "Welcome to the Contract PDF Service. Use /upload-pdfs to upload files and /query-contracts to query contract information."}
