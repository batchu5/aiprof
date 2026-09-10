from datetime import datetime
from typing import List, Dict, Any
from pydantic import BaseModel, Field


class ConversationModel(BaseModel):
    id: str
    project_id: str
    user_id: str
    title: str = "Tutor Conversation"
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
