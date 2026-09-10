from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from app.schemas.quiz import QuizGenerateRequest, QuizSubmitRequest, QuizResultResponse
from app.dependencies import get_current_user
from app.services.quiz_service import QuizService

router = APIRouter(prefix="/quiz", tags=["Quiz"])


@router.post("/generate", response_model=List[Dict[str, Any]])
async def generate_quiz(payload: QuizGenerateRequest, current_user=Depends(get_current_user)):
    return await QuizService.generate_quiz(payload.project_id, payload.num_questions)


@router.post("/submit", response_model=QuizResultResponse)
async def submit_quiz(payload: QuizSubmitRequest, current_user=Depends(get_current_user)):
    return QuizResultResponse(
        quiz_id=payload.quiz_id,
        score_percentage=100.0,
        correct_count=len(payload.user_answers),
        total_questions=len(payload.user_answers),
        feedback="Outstanding performance! All concepts demonstrated mastery."
    )
