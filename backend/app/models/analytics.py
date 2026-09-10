from datetime import datetime
from typing import Dict, Any
from pydantic import BaseModel, Field


class AnalyticsModel(BaseModel):
    id: str
    user_id: str
    total_study_seconds: int = 0
    quizzes_taken: int = 0
    average_score: float = 0.0
    streak_days: int = 0
    updated_at: datetime = Field(default_factory=datetime.utcnow)
