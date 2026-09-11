from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class SpaceCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    icon: str = Field(default="📚")
    color: str = Field(default="#6366f1")


class SpaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class SpaceResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    icon: str = "📚"
    color: str = "#6366f1"
    project_count: int = 0
    recent_activity: Optional[str] = None
    overall_progress: float = 0.0
    created_at: datetime
    updated_at: datetime


class SpaceListResponse(BaseModel):
    spaces: List[SpaceResponse]
    total: int
