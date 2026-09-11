import logging
import uuid
import json
from typing import Any, Dict, List, Optional
from datetime import datetime

from app.database import init_supabase
from app.ai.gemini_client import gemini_client as default_gemini_client
from app.ai.prompts import PromptManager
from app.services.mastery_service import MasteryService

logger = logging.getLogger("uvicorn.error")


class RecommendationService:
    def __init__(self, supabase=None, gemini_client=None, mastery_service=None):
        self.supabase = supabase or init_supabase()
        self.gemini = gemini_client or default_gemini_client
        self.mastery = mastery_service or MasteryService(self.supabase)

    async def generate_recommendations(
        self,
        project_id: str,
        user_id: str,
        trigger: str = "manual"
    ) -> List[Dict[str, Any]]:
        """
        Generate personalized learning recommendations using AI.
        Collects concept mastery levels, activity logs, quiz performance, and tutor interactions,
        prompts Gemini with RECOMMENDATION_PROMPT, saves items to DB, and returns recommendations.
        """
        # 1. Fetch current mastery state
        mastery_data = await self.mastery.get_project_mastery(project_id, user_id)
        concepts = mastery_data.get("concepts", [])
        mastery_summary_lines = [
            f"- {c['name']}: {c['mastery_level']}% ({c['trend']})" for c in concepts
        ]
        mastery_summary = "\n".join(mastery_summary_lines) if mastery_summary_lines else "No concept assessments available yet."

        strengths = [c["name"] for c in concepts if c["mastery_level"] >= 80]
        weaknesses = [c["name"] for c in concepts if c["mastery_level"] < 40]

        # 2. Fetch recent activity (last 20 events)
        recent_activity_lines = []
        try:
            if hasattr(self.supabase, "table"):
                act_res = self.supabase.table("activity_events").select("*").eq("project_id", project_id).eq("user_id", user_id).order("created_at", desc=True).limit(20).execute()
                if act_res and hasattr(act_res, "data") and isinstance(act_res.data, list):
                    for act in act_res.data:
                        recent_activity_lines.append(f"- {act.get('event_type')}: {act.get('event_data')}")
        except Exception as act_err:
            logger.warning(f"[RecommendationService] fetch activity error: {act_err}")

        recent_activity = "\n".join(recent_activity_lines) if recent_activity_lines else "Recent interaction with study materials."

        # 3. Fetch recent quiz results (last 3 quizzes)
        quiz_lines = []
        try:
            if hasattr(self.supabase, "table"):
                q_res = self.supabase.table("quizzes").select("score, score_percentage, created_at").eq("project_id", project_id).eq("user_id", user_id).eq("status", "completed").order("created_at", desc=True).limit(3).execute()
                if q_res and hasattr(q_res, "data") and isinstance(q_res.data, list):
                    for q in q_res.data:
                        s = q.get("score") if q.get("score") is not None else q.get("score_percentage", 0.0)
                        quiz_lines.append(f"- Quiz score: {s}%")
        except Exception as q_err:
            logger.warning(f"[RecommendationService] fetch quizzes error: {q_err}")

        quiz_performance = "\n".join(quiz_lines) if quiz_lines else "Average assessment score: 70%"

        # 4. Fetch learning goal
        learning_goal = "Master project concepts thoroughly"
        try:
            if hasattr(self.supabase, "table"):
                p_res = self.supabase.table("projects").select("learning_goal").eq("id", project_id).execute()
                if p_res and hasattr(p_res, "data") and isinstance(p_res.data, list) and len(p_res.data) > 0:
                    learning_goal = p_res.data[0].get("learning_goal") or learning_goal
        except Exception:
            pass

        # 5. Format prompt and call Gemini
        rec_prompt = PromptManager.format_prompt(
            PromptManager.RECOMMENDATION_PROMPT,
            learning_goal=learning_goal,
            mastery_summary=mastery_summary,
            recent_activity=recent_activity,
            quiz_performance=quiz_performance,
            strengths=", ".join(strengths) if strengths else "None specified",
            weaknesses=", ".join(weaknesses) if weaknesses else "None specified"
        )

        generated_recs = []
        try:
            generated_recs = await self.gemini.generate_structured(
                prompt=rec_prompt,
                system_instruction="You are an expert personalized AI learning advisor."
            )
        except Exception as gen_err:
            logger.warning(f"[RecommendationService] Gemini recommendation error: {gen_err}")

        if not generated_recs or not isinstance(generated_recs, list):
            # Fallback recommendations if AI call fails
            weak_target = weaknesses[0] if weaknesses else "Core Concepts"
            generated_recs = [
                {
                    "type": "tutor_session",
                    "title": f"Review {weak_target} with AI Tutor",
                    "description": f"Ask the AI Tutor for a simplified breakdown of {weak_target} to strengthen your core understanding.",
                    "priority": 9,
                    "related_concept": weak_target
                },
                {
                    "type": "take_quiz",
                    "title": "Take an Adaptive Assessment Quiz",
                    "description": "Test your mastery on key concepts with a 5-question targeted adaptive quiz.",
                    "priority": 8,
                    "related_concept": None
                },
                {
                    "type": "review_material",
                    "title": "Review Document Materials",
                    "description": "Re-read study notes in your Materials tab to solidify key definitions.",
                    "priority": 7,
                    "related_concept": None
                }
            ]

        # 6. Save to DB (dismiss old active recommendations for project & user)
        now = datetime.utcnow().isoformat()
        try:
            if hasattr(self.supabase, "table"):
                self.supabase.table("recommendations").update({
                    "is_dismissed": True
                }).eq("project_id", project_id).eq("user_id", user_id).eq("is_dismissed", False).execute()
        except Exception as upd_err:
            logger.warning(f"[RecommendationService] dismiss old recs warning: {upd_err}")

        saved_recs = []
        for rec in generated_recs:
            rec_id = str(uuid.uuid4())
            rec_record = {
                "id": rec_id,
                "project_id": project_id,
                "user_id": user_id,
                "type": rec.get("type", "practice"),
                "title": rec.get("title", "Practice Study Material"),
                "description": rec.get("description", "Focus on key concepts to boost project mastery."),
                "priority": int(rec.get("priority", 5)),
                "is_dismissed": False,
                "is_completed": False,
                "created_at": now
            }

            try:
                if hasattr(self.supabase, "table"):
                    self.supabase.table("recommendations").insert(rec_record).execute()
            except Exception as ins_err:
                logger.warning(f"[RecommendationService] insert recommendation notice: {ins_err}")

            saved_recs.append(rec_record)

        return saved_recs

    async def get_recommendations(
        self,
        project_id: str,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """Get active (not dismissed or completed) recommendations for project."""
        try:
            if hasattr(self.supabase, "table"):
                res = self.supabase.table("recommendations").select("*").eq("project_id", project_id).eq("user_id", user_id).eq("is_dismissed", False).eq("is_completed", False).order("priority", desc=True).execute()
                if res and hasattr(res, "data") and isinstance(res.data, list) and len(res.data) > 0:
                    return res.data
        except Exception as err:
            logger.warning(f"[RecommendationService] get_recommendations notice: {err}")

        # Auto-generate if no active recommendations exist
        return await self.generate_recommendations(project_id=project_id, user_id=user_id, trigger="auto")

    async def dismiss_recommendation(
        self,
        recommendation_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Mark recommendation as dismissed."""
        try:
            if hasattr(self.supabase, "table"):
                self.supabase.table("recommendations").update({
                    "is_dismissed": True
                }).eq("id", recommendation_id).execute()
        except Exception as err:
            logger.warning(f"[RecommendationService] dismiss_recommendation notice: {err}")

        return {"id": recommendation_id, "is_dismissed": True}

    async def complete_recommendation(
        self,
        recommendation_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Mark recommendation as completed."""
        try:
            if hasattr(self.supabase, "table"):
                self.supabase.table("recommendations").update({
                    "is_completed": True
                }).eq("id", recommendation_id).execute()
        except Exception as err:
            logger.warning(f"[RecommendationService] complete_recommendation notice: {err}")

        return {"id": recommendation_id, "is_completed": True}
