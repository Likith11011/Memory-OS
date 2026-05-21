from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MemoryCreate(BaseModel):
    title: str
    content: str
    file_type: str = "text"

class MemoryResponse(BaseModel):
    id: int
    title: str
    content: str
    file_type: str
    tags: str
    similarity: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True
