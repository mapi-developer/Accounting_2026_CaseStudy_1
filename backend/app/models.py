# backend/app/models.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# Association table for Many-to-Many relationship between Documents and Tags
document_tags = Table(
    "document_tags",
    Base.metadata,
    Column("document_id", Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True, nullable=False)
    file_path = Column(String, nullable=False)
    extracted_text = Column(Text, nullable=True) # This is where the PDF text goes for searching
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    comments = relationship("Comment", back_populates="document", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=document_tags, back_populates="documents")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    color = Column(String, default="#3b82f6") # Hex color for the Next.js UI badges

    # Relationships
    documents = relationship("Document", secondary=document_tags, back_populates="tags")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    document = relationship("Document", back_populates="comments")