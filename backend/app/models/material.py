from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class MaterialModel(BaseModel):
    id: str
    project_id: str
    filename: str
    file_path: str
    file_type: str
    content_text: Optional[str] = None
    is_vectorized: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
