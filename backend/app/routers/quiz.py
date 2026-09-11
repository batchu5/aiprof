import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.dependencies import get_current_user
from app.database import get_supabase
from app.services.quiz_service import QuizService
from app.ai.gemini_client import gemini_client

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/projects/{project_id}/quizzes", tags=["Adaptive Assessment Engine"])


class QuizStartPayload(BaseModel):
    num_questions: int = Field(5, ge=1, le=10, description="Number of questions in quiz")
    question_types: List[str] = Field(["mcq", "open_ended"], description="List of question types to include")


class QuizAnswerPayload(BaseModel):
    question_id: str = Field(..., description="ID of question being answered")
    answer: str = Field(..., min_length=1, description="Student selected option or open-ended text")


async def verify_project_access(project_id: str, user_id: str, supabase_client: Any, current_user: Dict[str, Any]):
    """Verify that current user owns the project or is admin."""
    try:
        if hasattr(supabase_client, "table"):
            res = supabase_client.table("projects").select("user_id").eq("id", project_id).execute()
            if res and hasattr(res, "data") and res.data:
                proj_user = str(res.data[0].get("user_id"))
                if proj_user != user_id and current_user.get("role") != "admin":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access denied to this project"
                    )
    except HTTPException:
        raise
    except Exception as err:
        logger.warning(f"Project access verification notice: {err}")


@router.post("/start")
async def start_quiz(
    project_id: str,
    payload: Optional[QuizStartPayload] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Start a new adaptive quiz session for a project.
    Generates first question dynamically based on user concept mastery levels.
    """
    user_id = current_user["id"]
    await verify_project_access(project_id, user_id, supabase_client, current_user)

    num_q = payload.num_questions if payload else 5
    q_types = payload.question_types if payload else ["mcq", "open_ended"]

    qs = QuizService(supabase=supabase_client, gemini_client=gemini_client)
    res = await qs.start_quiz(
        project_id=project_id,
        user_id=user_id,
        num_questions=num_q,
        question_types=q_types
    )

    return {"success": True, "data": res}


@router.post("/{quiz_id}/answer")
async def submit_quiz_answer(
    project_id: str,
    quiz_id: str,
    payload: QuizAnswerPayload,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Submit an answer for a quiz question.
    Evaluates MCQ or Open-ended response and updates concept mastery levels.
    """
    user_id = current_user["id"]
    await verify_project_access(project_id, user_id, supabase_client, current_user)

    qs = QuizService(supabase=supabase_client, gemini_client=gemini_client)
    res = await qs.submit_answer(
        quiz_id=quiz_id,
        question_id=payload.question_id,
        user_id=user_id,
        answer=payload.answer
    )

    return {"success": True, "data": res}


@router.get("/{quiz_id}/next")
async def get_next_question(
    project_id: str,
    quiz_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Get the next adaptive question in an active quiz session.
    """
    user_id = current_user["id"]
    await verify_project_access(project_id, user_id, supabase_client, current_user)

    qs = QuizService(supabase=supabase_client, gemini_client=gemini_client)
    next_q = await qs.get_next_question(
        quiz_id=quiz_id,
        project_id=project_id,
        user_id=user_id
    )

    return {"success": True, "data": next_q}


@router.post("/{quiz_id}/complete")
async def complete_quiz(
    project_id: str,
    quiz_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Complete quiz session, recalculate overall project mastery, and retrieve AI performance summary.
    """
    user_id = current_user["id"]
    await verify_project_access(project_id, user_id, supabase_client, current_user)

    qs = QuizService(supabase=supabase_client, gemini_client=gemini_client)
    summary = await qs.complete_quiz(
        quiz_id=quiz_id,
        project_id=project_id,
        user_id=user_id
    )

    return {"success": True, "data": summary}


@router.get("")
async def list_quiz_history(
    project_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Get quiz history list for a project.
    """
    user_id = current_user["id"]
    await verify_project_access(project_id, user_id, supabase_client, current_user)

    qs = QuizService(supabase=supabase_client, gemini_client=gemini_client)
    history = await qs.get_quiz_history(project_id=project_id, user_id=user_id)

    return {"success": True, "data": history}


@router.get("/{quiz_id}")
async def get_quiz_detail(
    project_id: str,
    quiz_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Get detailed quiz session with all questions and answers.
    """
    user_id = current_user["id"]
    await verify_project_access(project_id, user_id, supabase_client, current_user)

    qs = QuizService(supabase=supabase_client, gemini_client=gemini_client)
    detail = await qs.get_quiz_detail(quiz_id=quiz_id, user_id=user_id)

    return {"success": True, "data": detail}
