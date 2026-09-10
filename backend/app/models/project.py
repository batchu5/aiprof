from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProjectModel(BaseModel):
    id: str
    space_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
