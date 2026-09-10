from typing import Dict, Any


class AnalyticsService:
    @staticmethod
    async def get_user_analytics(user_id: str) -> Dict[str, Any]:
        return {
            "total_study_hours": 28.5,
            "quizzes_completed": 18,
            "average_quiz_score": 88.5,
            "streak_days": 7,
            "overall_mastery": 84.0,
        }
