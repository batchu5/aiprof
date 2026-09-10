from datetime import datetime
from pydantic import BaseModel


class AnalyticsSummaryResponse(BaseModel):
    total_study_hours: float
    quizzes_completed: int
    average_quiz_score: float
    streak_days: int
    overall_mastery: float
