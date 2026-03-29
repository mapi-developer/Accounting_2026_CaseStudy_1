# backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
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

@app.post("/upload/", response_model=schemas.Document)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    # 1. Save the file locally
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 2. Extract text from the PDF
    extracted_text = extract_text_from_pdf(file_path)
    
    # 3. Save to Database
    document = crud.create_document(db, file.filename, file_path, extracted_text)
    return document

@app.get("/documents/", response_model=list[schemas.Document])
def read_documents(skip: int = 0, limit: int = 100, search: str = None, db: Session = Depends(database.get_db)):
    docs = crud.get_documents(db, skip=skip, limit=limit, search_query=search)
    return docs

@app.post("/documents/{document_id}/comments", response_model=schemas.Comment)
def add_comment(document_id: int, comment: schemas.CommentCreate, db: Session = Depends(database.get_db)):
    return crud.create_comment(db=db, document_id=document_id, comment=comment)