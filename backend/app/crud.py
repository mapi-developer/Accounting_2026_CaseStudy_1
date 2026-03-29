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

# backend/app/crud.py
def get_documents(db: Session, skip: int = 0, limit: int = 100, search_query: str | None = None, tags: list[str] | None = None):
    query = db.query(models.Document)
    if search_query:
        query = query.filter(
            or_(
                models.Document.filename.ilike(f"%{search_query}%"),
                models.Document.extracted_text.ilike(f"%{search_query}%") # Deep text search
            )
        )
    if tags:
        for tag_name in tags:
            query = query.filter(models.Document.tags.any(models.Tag.name == tag_name))
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
        file_path = db_document.file_path
        
        # Capture tags before document is deleted
        tags_to_check = list(db_document.tags)
        
        db.delete(db_document)
        db.commit()

        # --- ORPHAN CHECK FOR ALL TAGS ---
        for tag in tags_to_check:
            # Re-fetch tag to check its current relationships
            if not tag.documents:
                db.delete(tag)
        
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

def delete_comment(db: Session, comment_id: int):
    db_comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if db_comment:
        db.delete(db_comment)
        db.commit()
        return True
    return False

# --- Unlink a tag from a document (Removes row in document_tags table) ---
def remove_tag_from_document(db: Session, document_id: int, tag_id: int):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()

    if document and tag:
        if tag in document.tags:
            document.tags.remove(tag)
            db.commit()
            
            # --- ORPHAN CHECK ---
            # If this tag is no longer linked to ANY document, delete the tag itself
            if not tag.documents:
                db.delete(tag)
                db.commit()
            
            db.refresh(document)
    return document

# --- Delete a tag globally (Removes from all docs and system) ---
def delete_tag_globally(db: Session, tag_id: int):
    db_tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if db_tag:
        db.delete(db_tag)
        db.commit()
        return True
    return False
