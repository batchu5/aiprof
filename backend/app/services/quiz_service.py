from typing import List, Dict, Any
from app.ai.gemini_client import generate_response
from app.ai.prompts import QUIZ_GENERATOR_PROMPT


class QuizService:
    @staticmethod
    async def generate_quiz(project_id: str, num_questions: int = 5) -> List[Dict[str, Any]]:
        # Mock structured quiz questions
        return [
            {
                "id": 1,
                "question": "What is the primary function of Vector Embeddings in RAG applications?",
                "options": [
                    "Compressing PDF files for web transfer",
                    "Converting text into mathematical vectors for semantic search",
                    "Encrypting user authentication tokens",
                    "Formatting JSON responses in FastAPI"
                ],
                "correct": 1,
                "explanation": "Vector embeddings map text semantic meanings into multi-dimensional space, enabling high-precision similarity search."
            },
            {
                "id": 2,
                "question": "Which HTTP status code signifies an unauthorized access attempt in FastAPI?",
                "options": ["200 OK", "400 Bad Request", "401 Unauthorized", "500 Internal Error"],
                "correct": 2,
                "explanation": "HTTP status code 401 is standard for unauthenticated requests."
            }
        ]
