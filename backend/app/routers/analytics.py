import logging
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.dependencies import get_current_user
from app.database import get_supabase
from app.services.analytics_service import AnalyticsService

logger = logging.getLogger("uvicorn.error")

router = APIRouter(tags=["Analytics"])


@router.get("/projects/{project_id}/analytics")
async def get_project_analytics(
    project_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Get detailed analytics for a single project including activity events, concept performance, growth trends, and AI telemetry.
    """
    user_id = current_user["id"]
    ans = AnalyticsService(supabase=supabase_client)
    res = await ans.get_project_analytics(project_id=project_id, user_id=user_id)
    return {"success": True, "data": res}


@router.get("/analytics")
async def get_global_analytics(
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Get aggregated global learning analytics across all user's spaces and projects.
    """
    user_id = current_user["id"]
    ans = AnalyticsService(supabase=supabase_client)
    res = await ans.get_global_analytics(user_id=user_id)
    return {"success": True, "data": res}


@router.get("/analytics/ai-usage")
async def get_ai_usage_stats(
    project_id: Optional[str] = Query(None, description="Optional project ID filter"),
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Get telemetry metrics on AI requests, model distribution, latency, and token counts.
    """
    user_id = current_user["id"]
    ans = AnalyticsService(supabase=supabase_client)
    res = await ans.get_ai_usage_stats(user_id=user_id, project_id=project_id, days=days)
    return {"success": True, "data": res}
