from typing import List, Dict, Any


class ActivityService:
    @staticmethod
    async def log_activity(user_id: str, action_type: str, details: Dict[str, Any] = None) -> bool:
        return True

    @staticmethod
    async def get_recent_activities(user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        return [
            {
                "title": "Completed Machine Learning Quiz #2",
                "time": "2 hours ago",
                "score": "90%",
                "action_type": "quiz_completed"
            },
            {
                "title": "Uploaded CS101_Lecture_04.pdf",
                "time": "Yesterday",
                "score": "Processed",
                "action_type": "material_uploaded"
            }
        ]
