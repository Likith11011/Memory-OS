from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from backend.database import Base

class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    file_type = Column(String(50), default="text", nullable=False)
    tags = Column(String(500), default="", nullable=False)
    chroma_id = Column(String(255), unique=True, nullable=False)
    memory_category = Column(String(50), default="general")
    language = Column(String(50), default="")
    project_status = Column(String(50), default="")
    difficulty = Column(String(20), default="")
    subject = Column(String(100), default="")
    explanation = Column(Text, default="")
    last_reviewed = Column(DateTime(timezone=True), nullable=True)
    review_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)