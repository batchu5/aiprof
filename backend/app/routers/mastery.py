import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.database import get_supabase
from app.services.mastery_service import MasteryService

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/projects/{project_id}", tags=["Mastery & Growth"])


@router.get("/mastery")
async def get_project_mastery_overview(
    project_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Get complete mastery overview for a project.
    Returns overall mastery percentage, concept count breakdown, and detailed per-concept mastery levels.
    """
    user_id = current_user["id"]
    ms = MasteryService(supabase=supabase_client)
    res = await ms.get_project_mastery(project_id=project_id, user_id=user_id)
    return {"success": True, "data": res}


@router.get("/growth")
async def get_project_growth_data(
    project_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Get project growth analytics data, including concept trends, quiz performance history, strengths, weaknesses, and milestones.
    """
    user_id = current_user["id"]
    ms = MasteryService(supabase=supabase_client)
    res = await ms.get_growth_data(project_id=project_id, user_id=user_id)
    return {"success": True, "data": res}


@router.get("/concepts")
async def list_project_concepts(
    project_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    List concepts with mastery details for a project.
    """
    user_id = current_user["id"]
    ms = MasteryService(supabase=supabase_client)
    res = await ms.get_project_mastery(project_id=project_id, user_id=user_id)
    return {"success": True, "data": res.get("concepts", [])}
