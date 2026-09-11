import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.database import get_supabase
from app.services.recommendation_service import RecommendationService

logger = logging.getLogger("uvicorn.error")

router = APIRouter(tags=["AI Learning Recommendations"])


@router.get("/projects/{project_id}/recommendations")
async def get_project_recommendations(
    project_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Get active personalized learning recommendations for a project.
    """
    user_id = current_user["id"]
    rs = RecommendationService(supabase=supabase_client)
    res = await rs.get_recommendations(project_id=project_id, user_id=user_id)
    return {"success": True, "data": res}


@router.post("/projects/{project_id}/recommendations/generate")
async def generate_project_recommendations(
    project_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Trigger Gemini to generate fresh personalized learning recommendations based on current mastery & activity.
    """
    user_id = current_user["id"]
    rs = RecommendationService(supabase=supabase_client)
    res = await rs.generate_recommendations(project_id=project_id, user_id=user_id, trigger="manual")
    return {"success": True, "data": res}


@router.put("/recommendations/{recommendation_id}/dismiss")
async def dismiss_recommendation(
    recommendation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Mark a learning recommendation as dismissed.
    """
    user_id = current_user["id"]
    rs = RecommendationService(supabase=supabase_client)
    res = await rs.dismiss_recommendation(recommendation_id=recommendation_id, user_id=user_id)
    return {"success": True, "data": res}


@router.put("/recommendations/{recommendation_id}/complete")
async def complete_recommendation(
    recommendation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Mark a learning recommendation as completed.
    """
    user_id = current_user["id"]
    rs = RecommendationService(supabase=supabase_client)
    res = await rs.complete_recommendation(recommendation_id=recommendation_id, user_id=user_id)
    return {"success": True, "data": res}
