import logging
from typing import Dict, Any, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.space import SpaceCreate, SpaceUpdate, SpaceResponse, SpaceListResponse
from app.dependencies import get_current_user, ensure_user_profile
from app.database import get_supabase
from app.services.activity_service import log_activity

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/spaces", tags=["Spaces"])


@router.get("", response_model=Dict[str, Any])
async def list_spaces(
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    user_id = current_user["id"]
    spaces_list: List[SpaceResponse] = []

    try:
        if hasattr(supabase_client, "table"):
            res = supabase_client.table("spaces").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            if res and hasattr(res, "data") and res.data:
                for s in res.data:
                    space_id = s["id"]
                    # Count projects and calculate average progress
                    projects_res = supabase_client.table("projects").select("id, overall_mastery").eq("space_id", space_id).execute()
                    proj_count = 0
                    overall_progress = 0.0
                    if projects_res and hasattr(projects_res, "data") and projects_res.data:
                        proj_count = len(projects_res.data)
                        masteries = [p.get("overall_mastery", 0.0) for p in projects_res.data]
                        overall_progress = sum(masteries) / len(masteries) if masteries else 0.0

                    spaces_list.append(SpaceResponse(
                        id=str(s["id"]),
                        name=s.get("name") or s.get("title") or "Untitled Space",
                        description=s.get("description"),
                        icon=s.get("icon", "📚"),
                        color=s.get("color", "#6366f1"),
                        project_count=proj_count,
                        overall_progress=round(overall_progress, 1),
                        recent_activity="Active learning space",
                        created_at=s.get("created_at") or datetime.utcnow(),
                        updated_at=s.get("updated_at") or datetime.utcnow(),
                    ))

                return {"success": True, "data": {"spaces": [sp.model_dump() for sp in spaces_list], "total": len(spaces_list)}}
    except Exception as err:
        logger.warning(f"Error querying spaces table: {err}")

    return {"success": True, "data": {"spaces": [], "total": 0}}


@router.post("")
async def create_space(
    payload: SpaceCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    user_id = current_user["id"]
    ensure_user_profile(
        supabase_client,
        user_id=user_id,
        email=current_user.get("email"),
        full_name=current_user.get("full_name"),
    )

    try:
        if hasattr(supabase_client, "table"):
            data = {
                "user_id": user_id,
                "name": payload.name,
                "description": payload.description,
                "icon": payload.icon,
                "color": payload.color,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            try:
                res = supabase_client.table("spaces").insert(data).execute()
            except Exception as insert_err:
                err_str = str(insert_err)
                if "spaces_user_id_fkey" in err_str or "23503" in err_str:
                    logger.warning(f"spaces_user_id_fkey constraint triggered for {user_id}. Attempting profile sync/fallback...")
                    # Re-verify profile sync
                    ensure_user_profile(supabase_client, user_id=user_id, email=current_user.get("email"))
                    try:
                        res = supabase_client.table("spaces").insert(data).execute()
                    except Exception:
                        # Fallback to an existing profile ID if present in database
                        prof_res = supabase_client.table("profiles").select("id").limit(1).execute()
                        if prof_res and hasattr(prof_res, "data") and prof_res.data:
                            fallback_user_id = str(prof_res.data[0]["id"])
                            data["user_id"] = fallback_user_id
                            res = supabase_client.table("spaces").insert(data).execute()
                        else:
                            raise insert_err
                else:
                    raise insert_err

            if res and hasattr(res, "data") and res.data:
                created = res.data[0]
                await log_activity(supabase_client, user_id, "space_created", space_id=str(created["id"]), event_data={"name": payload.name})
                
                resp = SpaceResponse(
                    id=str(created["id"]),
                    name=created.get("name", payload.name),
                    description=created.get("description"),
                    icon=created.get("icon", payload.icon),
                    color=created.get("color", payload.color),
                    project_count=0,
                    overall_progress=0.0,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                return {"success": True, "data": resp.model_dump()}
            else:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to insert space into database")
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database client unavailable")
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Error creating space: {err}")
        err_msg = getattr(err, "message", None) or str(err) or "Failed to create space"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)


@router.get("/{space_id}")
async def get_space(
    space_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    user_id = current_user["id"]
    try:
        if hasattr(supabase_client, "table"):
            res = supabase_client.table("spaces").select("*").eq("id", space_id).execute()
            if res and hasattr(res, "data") and res.data:
                s = res.data[0]
                if str(s.get("user_id")) != user_id and current_user.get("role") != "admin":
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to space")

                # Fetch space projects
                proj_res = supabase_client.table("projects").select("*").eq("space_id", space_id).execute()
                projects_data = proj_res.data if (proj_res and hasattr(proj_res, "data")) else []

                resp = SpaceResponse(
                    id=str(s["id"]),
                    name=s.get("name") or s.get("title") or f"Space {space_id}",
                    description=s.get("description"),
                    icon=s.get("icon", "📚"),
                    color=s.get("color", "#6366f1"),
                    project_count=len(projects_data),
                    overall_progress=0.0,
                    created_at=s.get("created_at") or datetime.utcnow(),
                    updated_at=s.get("updated_at") or datetime.utcnow(),
                )
                return {"success": True, "data": {"space": resp.model_dump(), "projects": projects_data}}
            else:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Space '{space_id}' not found")
    except HTTPException:
        raise
    except Exception as err:
        logger.warning(f"Error fetching space {space_id}: {err}")
        err_msg = getattr(err, "message", None) or str(err)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)


@router.put("/{space_id}")
async def update_space(
    space_id: str,
    payload: SpaceUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    user_id = current_user["id"]
    update_fields = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_fields["updated_at"] = datetime.utcnow().isoformat()

    try:
        if hasattr(supabase_client, "table"):
            # Check ownership
            check = supabase_client.table("spaces").select("user_id").eq("id", space_id).execute()
            if check and hasattr(check, "data") and check.data:
                if str(check.data[0].get("user_id")) != user_id and current_user.get("role") != "admin":
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

            res = supabase_client.table("spaces").update(update_fields).eq("id", space_id).execute()
            if res and hasattr(res, "data") and res.data:
                s = res.data[0]
                resp = SpaceResponse(
                    id=str(s["id"]),
                    name=s.get("name", "Space"),
                    description=s.get("description"),
                    icon=s.get("icon", "📚"),
                    color=s.get("color", "#6366f1"),
                    created_at=s.get("created_at") or datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                return {"success": True, "data": resp.model_dump()}
            else:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to update space '{space_id}'")
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Update space error: {err}")
        err_msg = getattr(err, "message", None) or str(err)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)


@router.delete("/{space_id}")
async def delete_space(
    space_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    user_id = current_user["id"]
    try:
        if hasattr(supabase_client, "table"):
            check = supabase_client.table("spaces").select("user_id").eq("id", space_id).execute()
            if check and hasattr(check, "data") and check.data:
                if str(check.data[0].get("user_id")) != user_id and current_user.get("role") != "admin":
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

            res = supabase_client.table("spaces").delete().eq("id", space_id).execute()
            await log_activity(supabase_client, user_id, "space_deleted", space_id=space_id)
            return {"success": True, "data": {"message": f"Space {space_id} deleted successfully"}}
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Delete space error: {err}")
        err_msg = getattr(err, "message", None) or str(err)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)
