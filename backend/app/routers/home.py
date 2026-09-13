import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.database import get_supabase

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/home", tags=["Home Dashboard"])


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_home_dashboard(
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    user_id = current_user.get("id")
    full_name = current_user.get("full_name") or current_user.get("email", "").split("@")[0].title() or "Student"
    welcome_message = f"Welcome back, {full_name}!"

    # Clean empty defaults when user has no data
    continue_learning = None
    recent_projects: List[Dict[str, Any]] = []

    total_spaces = 0
    total_projects = 0

    overall_progress = {
        "total_concepts": 0,
        "mastered": 0,
        "overall_mastery": 0.0,
        "active_streak": 0,
        "total_spaces": 0,
        "total_projects": 0
    }

    areas_to_improve: List[Dict[str, Any]] = []
    recommended_actions: List[Dict[str, Any]] = []

    activity_summary = {
        "this_week": {"sessions": 0, "questions_asked": 0, "quizzes_taken": 0},
        "vs_last_week": "+0%",
        "daily_sparkline": [
            {"day": "Mon", "events": 0},
            {"day": "Tue", "events": 0},
            {"day": "Wed", "events": 0},
            {"day": "Thu", "events": 0},
            {"day": "Fri", "events": 0},
            {"day": "Sat", "events": 0},
            {"day": "Sun", "events": 0}
        ]
    }

    try:
        if hasattr(supabase_client, "table"):
            # Fetch spaces count
            sp_res = supabase_client.table("spaces").select("id").eq("user_id", user_id).execute()
            if sp_res and hasattr(sp_res, "data") and isinstance(sp_res.data, list):
                total_spaces = len(sp_res.data)
                overall_progress["total_spaces"] = total_spaces

            # Fetch user projects
            p_res = supabase_client.table("projects").select("id, name, space_id, overall_mastery, updated_at").eq("user_id", user_id).order("updated_at", desc=True).limit(5).execute()
            if p_res and hasattr(p_res, "data") and isinstance(p_res.data, list):
                total_projects = len(p_res.data)
                overall_progress["total_projects"] = total_projects

                if total_projects > 0:
                    for idx, p in enumerate(p_res.data):
                        sp_name = "Study Space"
                        p_id = str(p.get("id"))
                        try:
                            sp_id = str(p.get("space_id", ""))
                            if sp_id:
                                s_res = supabase_client.table("spaces").select("name").eq("id", sp_id).execute()
                                if s_res and hasattr(s_res, "data") and s_res.data:
                                    sp_name = s_res.data[0].get("name", sp_name)
                        except Exception:
                            pass

                        recent_projects.append({
                            "id": p_id,
                            "name": p.get("name") or f"Project #{idx+1}",
                            "space_name": sp_name,
                            "mastery": round(float(p.get("overall_mastery", 0.0)), 1),
                            "last_activity": p.get("updated_at") or p.get("created_at") or ""
                        })

                    if recent_projects:
                        first_p = recent_projects[0]
                        continue_learning = {
                            "project_id": first_p["id"],
                            "project_name": first_p["name"],
                            "space_name": first_p["space_name"],
                            "last_activity": first_p["last_activity"],
                            "last_action": f"Continue studying {first_p['name']}"
                        }

            # Fetch user activity events
            act_res = supabase_client.table("activity_events").select("event_type, created_at").eq("user_id", user_id).limit(100).execute()
            if act_res and hasattr(act_res, "data") and isinstance(act_res.data, list) and len(act_res.data) > 0:
                activity_summary["this_week"]["sessions"] = len(act_res.data)
                activity_summary["this_week"]["questions_asked"] = sum(1 for e in act_res.data if e.get("event_type") == "tutor_message_sent")
                activity_summary["this_week"]["quizzes_taken"] = sum(1 for e in act_res.data if "quiz" in str(e.get("event_type", "")))
                overall_progress["active_streak"] = max(1, min(7, len(act_res.data)))

            # Fetch concept mastery
            c_res = supabase_client.table("concept_mastery").select("mastery_level, concept_id").eq("user_id", user_id).execute()
            if c_res and hasattr(c_res, "data") and isinstance(c_res.data, list) and len(c_res.data) > 0:
                total_c = len(c_res.data)
                mastered_c = sum(1 for c in c_res.data if float(c.get("mastery_level", 0)) >= 80)
                avg_m = sum(float(c.get("mastery_level", 0)) for c in c_res.data) / total_c
                overall_progress["total_concepts"] = total_c
                overall_progress["mastered"] = mastered_c
                overall_progress["overall_mastery"] = round(avg_m, 1)

            # Fetch recommendations
            rec_res = supabase_client.table("recommendations").select("*").eq("user_id", user_id).limit(3).execute()
            if rec_res and hasattr(rec_res, "data") and isinstance(rec_res.data, list) and len(rec_res.data) > 0:
                for r in rec_res.data:
                    recommended_actions.append({
                        "id": str(r.get("id")),
                        "type": r.get("action_type", "take_quiz"),
                        "title": r.get("title", "Recommended Action"),
                        "description": r.get("reason", "Tailored learning recommendation"),
                        "project_name": "Project",
                        "project_id": str(r.get("project_id", ""))
                    })

    except Exception as err:
        logger.warning(f"[HomeRouter] Error querying home dashboard metrics: {err}")

    return {
        "welcome_message": welcome_message,
        "continue_learning": continue_learning,
        "recent_projects": recent_projects,
        "overall_progress": overall_progress,
        "areas_to_improve": areas_to_improve,
        "recommended_actions": recommended_actions,
        "activity_summary": activity_summary
    }
