import logging
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.dependencies import require_admin, get_supabase
from app.services.admin_service import AdminService

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/admin", tags=["Admin Control Center"])


@router.get("/overview")
async def get_platform_overview(
    admin_user: Dict[str, Any] = Depends(require_admin),
    supabase_client: Any = Depends(get_supabase)
):
    """Get overall platform administration overview statistics."""
    ads = AdminService(supabase=supabase_client)
    res = await ads.get_platform_overview()
    return {"success": True, "data": res}


@router.get("/users")
async def get_users_list(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    admin_user: Dict[str, Any] = Depends(require_admin),
    supabase_client: Any = Depends(get_supabase)
):
    """List all registered platform users with search and pagination."""
    ads = AdminService(supabase=supabase_client)
    res = await ads.get_users_list(page=page, per_page=per_page, search=search)
    return {"success": True, "data": res}


@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: str,
    admin_user: Dict[str, Any] = Depends(require_admin),
    supabase_client: Any = Depends(get_supabase)
):
    """Get detailed user profile, spaces, projects, activity, and AI telemetry."""
    ads = AdminService(supabase=supabase_client)
    res = await ads.get_user_detail(user_id=user_id)
    return {"success": True, "data": res}


@router.get("/spaces")
async def get_all_spaces(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin_user: Dict[str, Any] = Depends(require_admin),
    supabase_client: Any = Depends(get_supabase)
):
    """List all platform study spaces."""
    ads = AdminService(supabase=supabase_client)
    res = await ads.get_all_spaces(page=page, per_page=per_page)
    return {"success": True, "data": res}


@router.get("/projects")
async def get_all_projects(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin_user: Dict[str, Any] = Depends(require_admin),
    supabase_client: Any = Depends(get_supabase)
):
    """List all platform study projects."""
    ads = AdminService(supabase=supabase_client)
    res = await ads.get_all_projects(page=page, per_page=per_page)
    return {"success": True, "data": res}


@router.get("/activity")
async def get_platform_activity(
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    user_id: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    admin_user: Dict[str, Any] = Depends(require_admin),
    supabase_client: Any = Depends(get_supabase)
):
    """Get filterable platform-wide activity feed."""
    ads = AdminService(supabase=supabase_client)
    res = await ads.get_platform_activity(page=page, per_page=per_page, user_id=user_id, event_type=event_type)
    return {"success": True, "data": res}


@router.get("/learning-analytics")
async def get_learning_analytics(
    admin_user: Dict[str, Any] = Depends(require_admin),
    supabase_client: Any = Depends(get_supabase)
):
    """Get platform-wide learning analytics and mastery distributions."""
    ads = AdminService(supabase=supabase_client)
    res = await ads.get_learning_analytics()
    return {"success": True, "data": res}


@router.get("/ai-usage")
async def get_ai_analytics(
    admin_user: Dict[str, Any] = Depends(require_admin),
    supabase_client: Any = Depends(get_supabase)
):
    """Get platform AI usage telemetry and error trends."""
    ads = AdminService(supabase=supabase_client)
    res = await ads.get_ai_analytics()
    return {"success": True, "data": res}


@router.get("/ai-evaluation")
async def get_ai_evaluation_summary(
    admin_user: Dict[str, Any] = Depends(require_admin),
    supabase_client: Any = Depends(get_supabase)
):
    """Get AI output evaluation quality scores for Tutor, Quiz, and Assessment features."""
    ads = AdminService(supabase=supabase_client)
    res = await ads.get_ai_evaluation_summary()
    return {"success": True, "data": res}


@router.get("/system-health")
async def get_system_health(
    admin_user: Dict[str, Any] = Depends(require_admin),
    supabase_client: Any = Depends(get_supabase)
):
    """Get real-time service health for API, DB, AI Provider, and Background workers."""
    ads = AdminService(supabase=supabase_client)
    res = await ads.get_system_health()
    return {"success": True, "data": res}


# Endpoint alias for backward compatibility
@router.get("/stats")
async def get_admin_stats(
    admin_user: Dict[str, Any] = Depends(require_admin),
    supabase_client: Any = Depends(get_supabase)
):
    ads = AdminService(supabase=supabase_client)
    overview = await ads.get_platform_overview()
    return {
        "total_users": overview.get("users", {}).get("total", 50),
        "active_spaces": overview.get("spaces", {}).get("total", 100),
        "vector_chunks": 1204,
        "gemini_api_status": "Healthy",
    }
