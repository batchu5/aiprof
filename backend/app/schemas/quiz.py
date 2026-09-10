from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel


class QuizGenerateRequest(BaseModel):
    project_id: str
    num_questions: int = 5
    difficulty: str = "medium"


class QuizQuestionSchema(BaseModel):
    id: int
    question: str
    options: List[str]
    correct: Optional[int] = None
    explanation: Optional[str] = None


class QuizSubmitRequest(BaseModel):
    quiz_id: str
    user_answers: Dict[str, int]  # question_id -> chosen option index


class QuizResultResponse(BaseModel):
    quiz_id: str
    score_percentage: float
    correct_count: int
    total_questions: int
    feedback: str
