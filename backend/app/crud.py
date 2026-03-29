# backend/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import or_
from . import models, schemas
import os

def create_document(db:Session, filename:str, file_path:str, extracted_text:str):
    db_document = models.Document(
        filename=filename, 
        file_path=file_path, 
        extracted_text=extracted_text
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

def get_documents(db:Session, skip:int = 0, limit:int = 100, search_query:str | None = None):
    query = db.query(models.Document)
    
    # This is the magic for your Full-Text Search inside the PDFs
    if search_query:
        query = query.filter(
            or_(
                models.Document.filename.ilike(f"%{search_query}%"),
                models.Document.extracted_text.ilike(f"%{search_query}%")
            )
        )
        
    return query.offset(skip).limit(limit).all()

def create_comment(db:Session, document_id:int, comment:schemas.CommentCreate):
    db_comment = models.Comment(**comment.model_dump(), document_id=document_id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment