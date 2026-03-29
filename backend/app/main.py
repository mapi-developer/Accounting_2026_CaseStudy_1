# backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # NEW IMPORT
from sqlalchemy.orm import Session
from typing import List
import shutil
import os

from . import models, schemas, crud, database
from .utils.pdf_parser import extract_text_from_pdf

# Create the database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Accounting Case Study API")

# Allow Next.js frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- NEW LINE: MOUNT THE DIRECTORY ---
# This allows the frontend to fetch the actual PDF files via HTTP
app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")

@app.post("/upload/", response_model=List[schemas.Document])
async def upload_documents(files: List[UploadFile] = File(...), db: Session = Depends(database.get_db)):
    uploaded_docs = []
    
    for file in files:
        # 1. Save the file locally
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 2. Extract text from the PDF
        extracted_text = extract_text_from_pdf(file_path)
        
        # 3. Save to Database
        document = crud.create_document(db, file.filename, file_path, extracted_text)
        uploaded_docs.append(document)
        
    return uploaded_docs

@app.get("/documents/", response_model=list[schemas.Document])
def read_documents(skip: int = 0, limit: int = 100, search: str = None, db: Session = Depends(database.get_db)):
    docs = crud.get_documents(db, skip=skip, limit=limit, search_query=search)
    return docs

# --- NEW ENDPOINT ADDED HERE ---
@app.get("/documents/{document_id}", response_model=schemas.Document)
def read_document(document_id: int, db: Session = Depends(database.get_db)):
    db_document = crud.get_document(db, document_id=document_id)
    if db_document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return db_document

@app.post("/documents/{document_id}/comments", response_model=schemas.Comment)
def add_comment(document_id: int, comment: schemas.CommentCreate, db: Session = Depends(database.get_db)):
    return crud.create_comment(db=db, document_id=document_id, comment=comment)