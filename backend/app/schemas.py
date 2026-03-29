# backend/app/schemas.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- Tags ---
class TagBase(BaseModel):
    name: str
    color: Optional[str] = "#3b82f6"

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int

    class Config:
        from_attributes = True

# --- Comments ---
class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    id: int
    document_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Documents ---
class DocumentBase(BaseModel):
    filename: str

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    file_path: str
    uploaded_at: datetime
    tags: List[Tag] = []
    comments: List[Comment] = []
    # Note: We intentionally omit 'extracted_text' here so we don't send 
    # massive amounts of text to the frontend unless specifically requested.

    class Config:
        from_attributes = True