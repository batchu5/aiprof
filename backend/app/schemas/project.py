from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    space_id: str
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    learning_goal: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    learning_goal: Optional[str] = None
    status: Optional[str] = Field(default=None, pattern="^(active|archived|completed)$")


class ProjectResponse(BaseModel):
    id: str
    space_id: str
    name: str
    description: Optional[str] = None
    learning_goal: Optional[str] = None
    status: str = "active"
    overall_mastery: float = 0.0
    material_count: int = 0
    conversation_count: int = 0
    quiz_count: int = 0
    concept_count: int = 0
    last_activity: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ProjectDashboardResponse(BaseModel):
    project: ProjectResponse
    recent_activity: List[Dict[str, Any]] = Field(default_factory=list)
    top_concepts: List[Dict[str, Any]] = Field(default_factory=list)
    recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    mastery_summary: Dict[str, Any] = Field(default_factory=dict)
