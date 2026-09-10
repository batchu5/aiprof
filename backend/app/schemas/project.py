from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    space_id: str
    title: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    space_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    created_at: datetime
