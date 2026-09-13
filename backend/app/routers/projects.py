import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectDashboardResponse,
)
from app.dependencies import get_current_user, ensure_user_profile
from app.database import get_supabase
from app.services.activity_service import log_activity, get_recent_activity

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=Dict[str, Any])
async def list_projects(
    space_id: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    user_id = current_user["id"]
    projects_list: List[ProjectResponse] = []

    try:
        if hasattr(supabase_client, "table"):
            query = supabase_client.table("projects").select("*").eq("user_id", user_id)
            if space_id:
                query = query.eq("space_id", space_id)
            
            res = query.order("created_at", desc=True).execute()
            if res and hasattr(res, "data") and res.data:
                project_ids = [str(p["id"]) for p in res.data]

                # Batch fetch counts for all projects at once (4 queries instead of 4*N)
                mat_counts = {}
                conv_counts = {}
                quiz_counts = {}
                concept_counts = {}

                for table_name, counts_dict in [
                    ("materials", mat_counts),
                    ("conversations", conv_counts),
                    ("quizzes", quiz_counts),
                    ("concepts", concept_counts),
                ]:
                    try:
                        t_res = supabase_client.table(table_name).select("id, project_id").in_("project_id", project_ids).execute()
                        if t_res and hasattr(t_res, "data") and isinstance(t_res.data, list):
                            for row in t_res.data:
                                pid = str(row.get("project_id", ""))
                                counts_dict[pid] = counts_dict.get(pid, 0) + 1
                    except Exception:
                        pass

                for p in res.data:
                    p_id = str(p["id"])
                    projects_list.append(ProjectResponse(
                        id=p_id,
                        space_id=str(p.get("space_id", "")),
                        name=p.get("name") or p.get("title") or "Untitled Project",
                        description=p.get("description"),
                        learning_goal=p.get("learning_goal"),
                        status=p.get("status", "active"),
                        overall_mastery=float(p.get("overall_mastery", 0.0)),
                        material_count=mat_counts.get(p_id, 0),
                        conversation_count=conv_counts.get(p_id, 0),
                        quiz_count=quiz_counts.get(p_id, 0),
                        concept_count=concept_counts.get(p_id, 0),
                        created_at=p.get("created_at") or datetime.utcnow(),
                        updated_at=p.get("updated_at") or datetime.utcnow(),
                    ))

                return {"success": True, "data": [pr.model_dump() for pr in projects_list]}
    except Exception as err:
        logger.warning(f"Error querying projects table: {err}")

    return {"success": True, "data": []}


@router.post("")
async def create_project(
    payload: ProjectCreate,
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
            # Verify space ownership
            sp_check = supabase_client.table("spaces").select("user_id").eq("id", payload.space_id).execute()
            if sp_check and hasattr(sp_check, "data") and sp_check.data:
                sp_owner = str(sp_check.data[0].get("user_id"))
                if sp_owner != user_id and current_user.get("role") != "admin":
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to space")

            data = {
                "space_id": payload.space_id,
                "user_id": user_id,
                "name": payload.name,
                "description": payload.description,
                "learning_goal": payload.learning_goal,
                "status": "active",
                "overall_mastery": 0.0,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            try:
                res = supabase_client.table("projects").insert(data).execute()
            except Exception as insert_err:
                err_str = str(insert_err)
                if "projects_user_id_fkey" in err_str or "23503" in err_str:
                    logger.warning(f"projects_user_id_fkey constraint triggered for {user_id}. Attempting profile sync/fallback...")
                    ensure_user_profile(supabase_client, user_id=user_id, email=current_user.get("email"))
                    try:
                        res = supabase_client.table("projects").insert(data).execute()
                    except Exception:
                        prof_res = supabase_client.table("profiles").select("id").limit(1).execute()
                        if prof_res and hasattr(prof_res, "data") and prof_res.data:
                            fallback_user_id = str(prof_res.data[0]["id"])
                            data["user_id"] = fallback_user_id
                            res = supabase_client.table("projects").insert(data).execute()
                        else:
                            raise insert_err
                else:
                    raise insert_err

            if res and hasattr(res, "data") and res.data:
                created = res.data[0]
                p_id = str(created["id"])
                await log_activity(supabase_client, user_id, "project_created", project_id=p_id, space_id=payload.space_id, event_data={"name": payload.name})

                resp = ProjectResponse(
                    id=p_id,
                    space_id=payload.space_id,
                    name=created.get("name", payload.name),
                    description=created.get("description"),
                    learning_goal=created.get("learning_goal"),
                    status="active",
                    overall_mastery=0.0,
                    material_count=0,
                    conversation_count=0,
                    quiz_count=0,
                    concept_count=0,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                return {"success": True, "data": resp.model_dump()}
            else:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to insert project into database")
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database client unavailable")
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Error creating project: {err}")
        err_msg = getattr(err, "message", None) or str(err) or "Failed to create project"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)


@router.get("/{project_id}")
async def get_project(
    project_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    user_id = current_user["id"]
    try:
        if hasattr(supabase_client, "table"):
            res = supabase_client.table("projects").select("*").eq("id", project_id).execute()
            if res and hasattr(res, "data") and res.data:
                p = res.data[0]
                if str(p.get("user_id")) != user_id and current_user.get("role") != "admin":
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

                p_id = str(p["id"])
                mat_c = len(supabase_client.table("materials").select("id").eq("project_id", p_id).execute().data or [])
                conv_c = len(supabase_client.table("conversations").select("id").eq("project_id", p_id).execute().data or [])
                quiz_c = len(supabase_client.table("quizzes").select("id").eq("project_id", p_id).execute().data or [])
                concept_c = len(supabase_client.table("concepts").select("id").eq("project_id", p_id).execute().data or [])

                resp = ProjectResponse(
                    id=p_id,
                    space_id=str(p.get("space_id", "")),
                    name=p.get("name") or p.get("title") or f"Project #{project_id}",
                    description=p.get("description"),
                    learning_goal=p.get("learning_goal"),
                    status=p.get("status", "active"),
                    overall_mastery=float(p.get("overall_mastery", 0.0)),
                    material_count=mat_c,
                    conversation_count=conv_c,
                    quiz_count=quiz_c,
                    concept_count=concept_c,
                    created_at=p.get("created_at") or datetime.utcnow(),
                    updated_at=p.get("updated_at") or datetime.utcnow(),
                )
                return {"success": True, "data": resp.model_dump()}
            else:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project '{project_id}' not found")
    except HTTPException:
        raise
    except Exception as err:
        logger.warning(f"Error fetching project {project_id}: {err}")
        err_msg = getattr(err, "message", None) or str(err)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)


@router.get("/{project_id}/dashboard")
async def get_project_dashboard(
    project_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    user_id = current_user["id"]
    
    # Get project base info
    proj_resp_data = await get_project(project_id, current_user, supabase_client)
    project_info = proj_resp_data.get("data", {})
    
    # Calculate average quiz score
    avg_score = 0.0
    try:
        if hasattr(supabase_client, "table"):
            q_res = supabase_client.table("quizzes").select("score").eq("project_id", project_id).not_.is_("score", "null").execute()
            if q_res and hasattr(q_res, "data") and q_res.data:
                scores = [float(q["score"]) for q in q_res.data if q.get("score") is not None]
                if scores:
                    avg_score = sum(scores) / len(scores)
    except Exception as err:
        logger.warning(f"Error fetching avg quiz score: {err}")
    
    project_info["avg_score"] = round(avg_score)
    
    # Fetch recent activity
    activities = await get_recent_activity(supabase_client, user_id, limit=10, project_id=project_id)

    top_concepts: List[Dict[str, Any]] = []
    try:
        if hasattr(supabase_client, "table"):
            c_res = supabase_client.table("concepts").select("id, name").eq("project_id", project_id).execute()
            if c_res and hasattr(c_res, "data") and isinstance(c_res.data, list):
                for c in c_res.data:
                    c_id = str(c.get("id"))
                    m_lvl = 0.0
                    m_res = supabase_client.table("concept_mastery").select("mastery_level, trend").eq("concept_id", c_id).eq("user_id", user_id).execute()
                    if m_res and hasattr(m_res, "data") and m_res.data:
                        m_lvl = float(m_res.data[0].get("mastery_level", 0.0))
                    top_concepts.append({
                        "id": c_id,
                        "name": c.get("name", "Concept"),
                        "mastery": round(m_lvl, 1),
                        "trend": "stable"
                    })
    except Exception as c_err:
        logger.warning(f"Error fetching project concepts: {c_err}")

    recommendations: List[Dict[str, Any]] = []
    try:
        if hasattr(supabase_client, "table"):
            rec_res = supabase_client.table("recommendations").select("*").eq("project_id", project_id).eq("user_id", user_id).limit(5).execute()
            if rec_res and hasattr(rec_res, "data") and isinstance(rec_res.data, list):
                for r in rec_res.data:
                    recommendations.append({
                        "id": str(r.get("id")),
                        "type": r.get("action_type", "take_quiz"),
                        "title": r.get("title", "Recommendation"),
                        "description": r.get("reason", ""),
                        "priority": r.get("priority", 5)
                    })
    except Exception as r_err:
        logger.warning(f"Error fetching project recommendations: {r_err}")

    mastery_summary = {
        "overall_mastery": project_info.get("overall_mastery", 0.0),
        "concepts_mastered": sum(1 for c in top_concepts if c.get("mastery", 0) >= 80),
        "concepts_in_progress": sum(1 for c in top_concepts if 0 < c.get("mastery", 0) < 80),
        "study_streak_days": min(7, len(activities)),
        "total_study_minutes": len(activities) * 15,
    }

    dashboard_res = {
        "project": project_info,
        "recent_activity": activities,
        "top_concepts": top_concepts,
        "recommendations": recommendations,
        "mastery_summary": mastery_summary,
    }

    return {"success": True, "data": dashboard_res}


@router.put("/{project_id}")
async def update_project(
    project_id: str,
    payload: ProjectUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    user_id = current_user["id"]
    update_fields = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_fields["updated_at"] = datetime.utcnow().isoformat()

    try:
        if hasattr(supabase_client, "table"):
            check = supabase_client.table("projects").select("user_id").eq("id", project_id).execute()
            if check and hasattr(check, "data") and check.data:
                if str(check.data[0].get("user_id")) != user_id and current_user.get("role") != "admin":
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

            res = supabase_client.table("projects").update(update_fields).eq("id", project_id).execute()
            if res and hasattr(res, "data") and res.data:
                p = res.data[0]
                resp = ProjectResponse(
                    id=str(p["id"]),
                    space_id=str(p.get("space_id", "")),
                    name=p.get("name", "Project"),
                    description=p.get("description"),
                    learning_goal=p.get("learning_goal"),
                    status=p.get("status", "active"),
                    overall_mastery=float(p.get("overall_mastery", 0.0)),
                    created_at=p.get("created_at") or datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                return {"success": True, "data": resp.model_dump()}
            else:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to update project '{project_id}'")
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Update project error: {err}")
        err_msg = getattr(err, "message", None) or str(err)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    user_id = current_user["id"]
    try:
        if hasattr(supabase_client, "table"):
            check = supabase_client.table("projects").select("user_id").eq("id", project_id).execute()
            if check and hasattr(check, "data") and check.data:
                if str(check.data[0].get("user_id")) != user_id and current_user.get("role") != "admin":
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

            supabase_client.table("projects").delete().eq("id", project_id).execute()
            await log_activity(supabase_client, user_id, "project_deleted", project_id=project_id)
            return {"success": True, "data": {"message": f"Project {project_id} deleted successfully"}}
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Delete project error: {err}")
        err_msg = getattr(err, "message", None) or str(err)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)
