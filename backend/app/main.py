# backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Form
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

@app.delete("/documents/{document_id}")
def delete_document_endpoint(document_id: int, db: Session = Depends(database.get_db)):
    file_path = crud.delete_document(db, document_id)
    
    if file_path is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete the physical file from the disk
    if os.path.exists(file_path):
        os.remove(file_path)
        
    return {"message": "Document deleted successfully"}

@app.get("/documents/", response_model=list[schemas.Document])
def read_documents(
    skip: int = 0, 
    limit: int = 100, 
    search: str | None = None, 
    tags: list[str] | None = Query(None), # Accepts ?tags=Invoice&tags=Urgent
    db: Session = Depends(database.get_db)
):
    return crud.get_documents(db, skip=skip, limit=limit, search_query=search, tags=tags)

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

@app.get("/tags/", response_model=List[schemas.Tag])
def read_tags(db: Session = Depends(database.get_db)):
    return crud.get_all_tags(db)

@app.post("/tags/", response_model=schemas.Tag)
def create_tag(tag: schemas.TagCreate, db: Session = Depends(database.get_db)):
    db_tag = crud.get_tag_by_name(db, name=tag.name)
    if db_tag:
        raise HTTPException(status_code=400, detail="Tag already exists")
    return crud.create_tag(db=db, tag=tag)

@app.post("/documents/{document_id}/tags/{tag_id}", response_model=schemas.Document)
def link_tag_to_document(document_id: int, tag_id: int, db: Session = Depends(database.get_db)):
    updated_doc = crud.add_tag_to_document(db, document_id, tag_id)
    if not updated_doc:
        raise HTTPException(status_code=404, detail="Document or Tag not found")
    return updated_doc

@app.delete("/comments/{comment_id}")
def delete_comment_endpoint(comment_id: int, db: Session = Depends(database.get_db)):
    if not crud.delete_comment(db, comment_id):
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Comment deleted"}

@app.delete("/documents/{document_id}/tags/{tag_id}", response_model=schemas.Document)
def delete_tag_link(document_id: int, tag_id: int, db: Session = Depends(database.get_db)):
    updated_doc = crud.remove_tag_from_document(db, document_id, tag_id)
    if not updated_doc:
        raise HTTPException(status_code=404, detail="Link not found")
    return updated_doc

@app.delete("/tags/{tag_id}")
def delete_global_tag(tag_id: int, db: Session = Depends(database.get_db)):
    if not crud.delete_tag_globally(db, tag_id):
        raise HTTPException(status_code=404, detail="Tag not found")
    return {"message": "Tag deleted globally"}
