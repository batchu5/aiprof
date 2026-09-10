from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class QuizModel(BaseModel):
    id: str
    project_id: str
    title: str
    questions: List[Dict[str, Any]]
    total_questions: int
    created_at: datetime = Field(default_factory=datetime.utcnow)


class QuizAttemptModel(BaseModel):
    id: str
    quiz_id: str
    user_id: str
    score: float
    user_answers: Dict[str, Any]
    completed_at: datetime = Field(default_factory=datetime.utcnow)
