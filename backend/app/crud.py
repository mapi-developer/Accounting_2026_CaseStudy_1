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

def get_document(db: Session, document_id: int):
    return db.query(models.Document).filter(models.Document.id == document_id).first()

def create_comment(db:Session, document_id:int, comment:schemas.CommentCreate):
    db_comment = models.Comment(**comment.model_dump(), document_id=document_id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

def delete_document(db: Session, document_id: int):
    db_document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if db_document:
        file_path = db_document.file_path # Save path before deleting record
        db.delete(db_document)
        db.commit()
        return file_path
    return None

def get_tag_by_name(db: Session, name: str):
    return db.query(models.Tag).filter(models.Tag.name == name).first()

def create_tag(db: Session, tag: schemas.TagCreate):
    db_tag = models.Tag(name=tag.name, color=tag.color)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

def add_tag_to_document(db: Session, document_id: int, tag_id: int):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    
    if document and tag:
        document.tags.append(tag)
        db.commit()
        db.refresh(document)
    return document

def get_all_tags(db: Session):
    return db.query(models.Tag).all()
