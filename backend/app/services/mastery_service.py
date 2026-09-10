from typing import List, Dict, Any


class MasteryService:
    @staticmethod
    async def get_user_mastery(user_id: str) -> List[Dict[str, Any]]:
        return [
            {"topic": "Neural Networks & Backpropagation", "mastery_score": 85.0},
            {"topic": "FastAPI Dependency Injection", "mastery_score": 92.5},
            {"topic": "PostgreSQL Vector Indexes", "mastery_score": 78.0},
        ]
