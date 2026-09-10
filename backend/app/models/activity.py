from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ActivityModel(BaseModel):
    id: str
    user_id: str
    action_type: str  # e.g., 'quiz_completed', 'material_uploaded', 'tutor_query'
    details: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
