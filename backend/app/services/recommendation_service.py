from typing import List, Dict, Any


class RecommendationService:
    @staticmethod
    async def get_study_recommendations(user_id: str) -> List[Dict[str, Any]]:
        return [
            {
                "topic": "Neural Networks & Backpropagation",
                "space": "Machine Learning",
                "priority": "High",
                "reason": "Recent quiz score dropped below 75%"
            },
            {
                "topic": "Process Deadlocks & Mutexes",
                "space": "Computer Systems",
                "priority": "Medium",
                "reason": "Not reviewed in over 5 days"
            }
        ]
