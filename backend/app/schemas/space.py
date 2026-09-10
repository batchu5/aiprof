from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class SpaceCreate(BaseModel):
    title: str
    description: Optional[str] = None


class SpaceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class SpaceResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    created_at: datetime
    projects_count: int = 0
