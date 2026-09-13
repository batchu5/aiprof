import logging
import uuid
import random
import asyncio
from typing import Any, Dict, List, Optional
from datetime import datetime

from app.database import init_supabase
from app.ai.gemini_client import gemini_client as default_gemini_client
from app.ai.prompts import PromptManager
from app.services.knowledge_service import KnowledgeService
from app.services.activity_service import log_activity

logger = logging.getLogger("uvicorn.error")


class QuizService:
    def __init__(self, supabase=None, gemini_client=None, knowledge_service=None):
        self.supabase = supabase or init_supabase()
        self.gemini = gemini_client or default_gemini_client
        self.knowledge = knowledge_service or KnowledgeService(self.supabase, self.gemini)

    async def start_quiz(
        self,
        project_id: str,
        user_id: str,
        num_questions: int = 5,
        question_types: List[str] = None
    ) -> Dict[str, Any]:
        """
        Start a new adaptive quiz.
        1. Get all concepts and their mastery levels for this project
        2. Create quiz record in DB
        3. Generate the first question using _select_next_question()
        4. Return quiz with first question
        """
        if not question_types:
            question_types = ["mcq", "open_ended"]

        quiz_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        quiz_data = {
            "id": quiz_id,
            "project_id": project_id,
            "user_id": user_id,
            "title": f"Adaptive Quiz - {datetime.utcnow().strftime('%b %d, %H:%M')}",
            "total_questions": max(1, min(10, num_questions)),
            "correct_answers": 0,
            "score": 0.0,
            "status": "in_progress",
            "started_at": now,
            "created_at": now,
        }

        try:
            if hasattr(self.supabase, "table"):
                self.supabase.table("quizzes").insert(quiz_data).execute()
        except Exception as err:
            logger.warning(f"[QuizService] start_quiz DB warning: {err}")

        # Generate first question
        first_question = await self._select_next_question(
            quiz_id=quiz_id,
            project_id=project_id,
            user_id=user_id,
            question_types=question_types
        )

        return {
            "quiz_id": quiz_id,
            "quiz": quiz_data,
            "first_question": first_question,
            "question": first_question
        }

    async def _select_next_question(
        self,
        quiz_id: str,
        project_id: str,
        user_id: str,
        question_types: List[str]
    ) -> Dict[str, Any]:
        """
        ADAPTIVE SELECTION ALGORITHM:
        1. Get all concepts with mastery levels
        2. Get already-asked concepts in this quiz (avoid repeats)
        3. Weighted selection:
           - Concepts with mastery < 50% → weight 3x (focus on weak areas)
           - Concepts with mastery 50-75% → weight 2x (reinforce developing areas)
           - Concepts with mastery > 75% → weight 1x (occasional review)
           - Concepts with trend 'needs_attention' or 'declining' → extra weight 2x
           - Recently answered / asked concepts → reduce weight (0.15x)
        4. Select concept based on weights
        5. Determine difficulty:
           - Mastery < 30% → 'easy'
           - Mastery 30-70% → 'medium'
           - Mastery > 70% → 'hard'
        6. Alternate question types (mcq/open_ended)
        7. Get relevant material content for the concept (via knowledge search)
        8. Generate question using Gemini
        9. Save to quiz_questions table
        10. Return question (WITHOUT correct answer for MCQ)
        """

        # 1. Fetch concepts & already asked questions
        concepts = []
        already_asked_concept_ids = set()
        asked_count = 0

        try:
            if hasattr(self.supabase, "table"):
                c_res = self.supabase.table("concepts").select("*").eq("project_id", project_id).execute()
                if c_res and hasattr(c_res, "data") and isinstance(c_res.data, list):
                    concepts = [c for c in c_res.data if isinstance(c, dict)]

                q_res = self.supabase.table("quiz_questions").select("concept_id").eq("quiz_id", quiz_id).execute()
                if q_res and hasattr(q_res, "data") and isinstance(q_res.data, list):
                    already_asked_concept_ids = {str(q.get("concept_id")) for q in q_res.data if isinstance(q, dict) and q.get("concept_id")}
                    asked_count = len(q_res.data)
        except Exception as err:
            logger.warning(f"[QuizService] _select_next_question DB query notice: {err}")

        # If no concepts exist in database yet, pull top search topics from knowledge service or fallback concepts
        if not concepts:
            concepts = [
                {"id": str(uuid.uuid4()), "name": "Core Principles", "description": "Fundamental project principles"},
                {"id": str(uuid.uuid4()), "name": "Key Mechanisms", "description": "Core operational mechanisms"},
                {"id": str(uuid.uuid4()), "name": "Practical Applications", "description": "Real-world domain implementation"}
            ]

        # 2. Enrich concepts with user mastery levels
        concept_weights = []
        for concept in concepts:
            c_id = str(concept.get("id", ""))
            mastery = 40.0
            trend = "new"

            try:
                if hasattr(self.supabase, "table") and c_id:
                    m_res = self.supabase.table("concept_mastery").select("mastery_level, trend").eq("concept_id", c_id).eq("user_id", user_id).execute()
                    if m_res and hasattr(m_res, "data") and isinstance(m_res.data, list) and len(m_res.data) > 0:
                        val = m_res.data[0].get("mastery_level", 40.0)
                        if isinstance(val, (int, float, str)) and not isinstance(val, bool):
                            mastery = float(val)
                        trend = str(m_res.data[0].get("trend", "new"))
            except Exception:
                pass

            concept["mastery_level"] = mastery
            concept["trend"] = trend

            # Calculate weight
            if mastery < 50:
                weight = 3.0
            elif mastery <= 75:
                weight = 2.0
            else:
                weight = 1.0

            if trend in ["needs_attention", "declining"]:
                weight *= 2.0

            if c_id in already_asked_concept_ids:
                weight *= 0.15

            concept_weights.append((concept, weight))

        # 3. Select concept based on weights
        target_concept = concepts[0]
        if concept_weights:
            total_w = sum(w for _, w in concept_weights)
            if total_w > 0:
                r = random.uniform(0, total_w)
                upto = 0.0
                for c, w in concept_weights:
                    if upto + w >= r:
                        target_concept = c
                        break
                    upto += w

        concept_name = target_concept.get("name", "Core Principles")
        try:
            mastery_lvl = float(target_concept.get("mastery_level", 40.0))
        except (TypeError, ValueError):
            mastery_lvl = 40.0

        # 4. Determine difficulty
        if mastery_lvl < 30:
            difficulty = "easy"
        elif mastery_lvl <= 70:
            difficulty = "medium"
        else:
            difficulty = "hard"

        # 5. Determine question type (alternate based on asked_count)
        if not question_types:
            question_types = ["mcq", "open_ended"]

        q_type = question_types[asked_count % len(question_types)]

        # 6. Fetch relevant material context via knowledge search
        chunks = await self.knowledge.search_knowledge(query=concept_name, project_id=project_id, top_k=3)
        if chunks:
            material_context = "\n\n".join([f"[{c.get('source_reference', 'Material')}]: {c.get('content', '')}" for c in chunks])
        else:
            material_context = f"Relevant study material regarding {concept_name} for the current project."

        # Fetch learning goal
        project_ctx = await self.knowledge.get_project_context(project_id, user_id)
        learning_goal = project_ctx.get("project", {}).get("learning_goal", "Master core domain concepts")

        # 7. Generate question using Gemini
        gen_prompt = PromptManager.format_prompt(
            PromptManager.QUIZ_GENERATION_PROMPT,
            learning_goal=learning_goal,
            concept_name=concept_name,
            mastery_level=int(mastery_lvl),
            difficulty=difficulty,
            previous_mistakes="Struggles with definitions or core steps" if mastery_lvl < 50 else "None recorded",
            material_context=material_context,
            question_type=q_type
        )

        generated = None
        try:
            logger.info(f"[QuizService] Calling Gemini generate_structured for concept: {concept_name}, type: {q_type}, difficulty: {difficulty}")
            generated = await self.gemini.generate_structured(
                prompt=gen_prompt,
                system_instruction="You are an expert adaptive learning assessment author."
            )
            logger.info(f"[QuizService] Gemini returned: type={type(generated).__name__}, value={generated}")
        except Exception as gen_err:
            logger.warning(f"[QuizService] Gemini generation exception: {gen_err}")

        # Fallback question structure if AI call fails
        if not generated or not isinstance(generated, dict) or "question_text" not in generated:
            reason = "None response" if generated is None else f"type={type(generated).__name__}, keys={list(generated.keys()) if isinstance(generated, dict) else 'N/A'}"
            logger.warning(f"[QuizService] Using FALLBACK question. Reason: {reason}")
            if q_type == "mcq":
                generated = {
                    "question_text": f"Which of the following best describes {concept_name}?",
                    "options": [
                        {"label": "A", "text": f"It defines the core principles governing {concept_name}.", "is_correct": True},
                        {"label": "B", "text": f"It is an auxiliary element unrelated to main workflow.", "is_correct": False},
                        {"label": "C", "text": f"It only applies when handling external hardware errors.", "is_correct": False},
                        {"label": "D", "text": f"It represents a legacy approach now deprecated.", "is_correct": False}
                    ],
                    "correct_answer": "A",
                    "explanation": f"Option A correctly identifies the core functionality of {concept_name}."
                }
            else:
                generated = {
                    "question_text": f"Explain the key principles and importance of {concept_name} in your own words.",
                    "correct_answer": f"{concept_name} plays a vital role in enabling structured domain operations and precise workflow management.",
                    "key_points": [f"Definition of {concept_name}", "Key components", "Practical application"],
                    "explanation": f"A standard answer should define {concept_name} and outline its practical applications."
                }

        # 7.5 Shuffle MCQ options so correct answer isn't always "A"
        if q_type == "mcq" and generated.get("options"):
            options = generated["options"]
            random.shuffle(options)
            labels = ["A", "B", "C", "D"]
            new_correct = "A"
            for idx, opt in enumerate(options):
                opt["label"] = labels[idx]
                if opt.get("is_correct"):
                    new_correct = labels[idx]
            generated["options"] = options
            generated["correct_answer"] = new_correct

        # 8. Save question to database
        question_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        q_record = {
            "id": question_id,
            "quiz_id": quiz_id,
            "concept_id": target_concept.get("id"),
            "question_type": q_type,
            "difficulty": difficulty,
            "question_text": generated.get("question_text", f"Question about {concept_name}"),
            "options": generated.get("options") if q_type == "mcq" else None,
            "correct_answer": generated.get("correct_answer"),
            "key_points": generated.get("key_points", []),
            "explanation": generated.get("explanation", ""),
            "material_context": material_context,
            "question_order": asked_count + 1,
            "user_answer": None,
            "is_correct": None,
            "score": None,
            "ai_feedback": None,
            "created_at": now
        }

        try:
            if hasattr(self.supabase, "table"):
                self.supabase.table("quiz_questions").insert(q_record).execute()
        except Exception as insert_err:
            logger.warning(f"[QuizService] Insert quiz question notice: {insert_err}")

        # 9. Return question payload (WITHOUT correct answer or solution flags)
        client_options = []
        if q_type == "mcq" and generated.get("options"):
            for opt in generated["options"]:
                client_options.append({
                    "label": opt.get("label"),
                    "text": opt.get("text")
                })

        return {
            "id": question_id,
            "quiz_id": quiz_id,
            "concept_name": concept_name,
            "question_text": q_record["question_text"],
            "question_type": q_type,
            "difficulty": difficulty,
            "options": client_options if q_type == "mcq" else None,
            "question_order": asked_count + 1
        }

    async def submit_answer(
        self,
        quiz_id: str,
        question_id: str,
        user_id: str,
        answer: str
    ) -> Dict[str, Any]:
        """
        Process a quiz answer.
        FOR MCQ: Compare answer label, set is_correct, return feedback & explanation.
        FOR OPEN-ENDED: Call Gemini with OPEN_ENDED_EVALUATION_PROMPT, parse evaluation, set score & ai_feedback.
        THEN: Update concept_mastery based on difficulty adjustments, update quiz record, log activity event.
        """
        # Fetch question details
        question = None
        try:
            if hasattr(self.supabase, "table"):
                res = self.supabase.table("quiz_questions").select("*").eq("id", question_id).execute()
                if res and hasattr(res, "data") and res.data:
                    question = res.data[0]
        except Exception as err:
            logger.warning(f"[QuizService] Fetch question error: {err}")

        if not question:
            # Fallback question mock if missing
            question = {
                "id": question_id,
                "quiz_id": quiz_id,
                "question_type": "mcq",
                "difficulty": "medium",
                "concept_name": "Core Principles",
                "correct_answer": "A",
                "explanation": "Option A is the correct answer."
            }

        q_type = question.get("question_type", "mcq")
        difficulty = question.get("difficulty", "medium")
        concept_id = question.get("concept_id")
        concept_name = question.get("concept_name", "Core Subject Concepts")

        is_correct = False
        score = 0.0
        feedback = ""
        eval_res = {}

        if q_type == "mcq":
            correct_label = str(question.get("correct_answer", "A")).strip().upper()
            user_label = str(answer).strip().upper()

            is_correct = (user_label == correct_label)
            score = 100.0 if is_correct else 0.0
            explanation = question.get("explanation", "")
            if is_correct:
                feedback = f"Correct! {explanation}"
            else:
                feedback = f"Option {correct_label} is correct. {explanation}"
        else:
            # Open-ended answer evaluation via Gemini
            eval_prompt = PromptManager.format_prompt(
                PromptManager.OPEN_ENDED_EVALUATION_PROMPT,
                question=question.get("question_text", ""),
                reference_answer=question.get("correct_answer", ""),
                key_points=", ".join(question.get("key_points", []) or ["Core concept understanding"]),
                student_answer=answer,
                material_context=question.get("material_context", "")
            )

            try:
                eval_result = await self.gemini.generate_structured(
                    prompt=eval_prompt,
                    system_instruction="You are an encouraging academic evaluator."
                )
                if isinstance(eval_result, dict):
                    eval_res = eval_result
                    score = float(eval_res.get("score", 70.0))
                    is_correct = bool(eval_res.get("is_correct", score >= 60.0))
                    feedback = eval_res.get("feedback", "Good effort in explaining this concept!")
                else:
                    logger.warning(f"[QuizService] generate_structured returned {type(eval_result).__name__}, using fallback scoring")
                    score = 80.0 if len(answer.split()) > 8 else 45.0
                    is_correct = score >= 60.0
                    feedback = "Answer recorded. Continue practicing this concept to build mastery."
            except Exception as eval_err:
                logger.warning(f"[QuizService] Open-ended evaluation notice: {eval_err}")
                score = 80.0 if len(answer.split()) > 8 else 45.0
                is_correct = score >= 60.0
                feedback = "Answer recorded. Continue practicing this concept to build mastery."

        # Update concept_mastery based on result:
        # Easy: correct +3, incorrect -5
        # Medium: correct +5, incorrect -3
        # Hard: correct +8, incorrect -1
        if difficulty == "easy":
            adj = 3.0 if is_correct else -5.0
        elif difficulty == "hard":
            adj = 8.0 if is_correct else -1.0
        else:
            adj = 5.0 if is_correct else -3.0

        if q_type == "open_ended":
            adj = adj * (score / 100.0) if is_correct else adj

        old_mastery = 45.0
        new_mastery = 50.0
        trend = "improving" if is_correct else "declining"

        try:
            if hasattr(self.supabase, "table") and concept_id:
                m_res = self.supabase.table("concept_mastery").select("id, mastery_level").eq("concept_id", concept_id).eq("user_id", user_id).execute()
                if m_res and hasattr(m_res, "data") and m_res.data:
                    rec_id = m_res.data[0]["id"]
                    old_mastery = float(m_res.data[0].get("mastery_level", 45.0))
                    new_mastery = max(0.0, min(100.0, old_mastery + adj))
                    trend = "improving" if new_mastery > old_mastery else ("declining" if new_mastery < old_mastery else "stable")

                    self.supabase.table("concept_mastery").update({
                        "mastery_level": new_mastery,
                        "trend": trend,
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("id", rec_id).execute()
                else:
                    new_mastery = max(0.0, min(100.0, 45.0 + adj))
                    self.supabase.table("concept_mastery").insert({
                        "concept_id": concept_id,
                        "user_id": user_id,
                        "mastery_level": new_mastery,
                        "trend": trend,
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }).execute()
        except Exception as m_err:
            logger.warning(f"[QuizService] Mastery DB update warning: {m_err}")

        # Update quiz question record
        try:
            if hasattr(self.supabase, "table"):
                self.supabase.table("quiz_questions").update({
                    "user_answer": answer,
                    "is_correct": is_correct,
                    "score": score,
                    "ai_feedback": feedback,
                }).eq("id", question_id).execute()
        except Exception as q_err:
            logger.warning(f"[QuizService] Question update error: {q_err}")

        # Update quiz correct_answers count and check if next question exists
        quiz_total = 5
        quiz_correct = 0
        has_next = True
        try:
            if hasattr(self.supabase, "table"):
                qz_res = self.supabase.table("quizzes").select("total_questions, correct_answers").eq("id", quiz_id).execute()
                if qz_res and hasattr(qz_res, "data") and qz_res.data:
                    quiz_total = qz_res.data[0].get("total_questions", 5)
                    quiz_correct = qz_res.data[0].get("correct_answers", 0)

                if is_correct:
                    quiz_correct += 1
                    self.supabase.table("quizzes").update({
                        "correct_answers": quiz_correct,
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("id", quiz_id).execute()

                # Count answered questions for this quiz
                ans_res = self.supabase.table("quiz_questions").select("id").eq("quiz_id", quiz_id).not_.is_("user_answer", "null").execute()
                answered_count = len(ans_res.data) if (ans_res and hasattr(ans_res, "data") and ans_res.data) else 1
                has_next = answered_count < quiz_total
        except Exception as qz_err:
            logger.warning(f"[QuizService] Quiz tally warning: {qz_err}")

        # Log activity event
        try:
            await log_activity(
                self.supabase,
                user_id,
                "quiz_answer_submitted",
                event_data={
                    "quiz_id": quiz_id,
                    "question_id": question_id,
                    "concept_name": concept_name,
                    "is_correct": is_correct,
                    "score": score
                }
            )
        except Exception:
            pass

        # Ensure eval_res is always a dict to prevent NoneType crashes
        if not isinstance(eval_res, dict):
            eval_res = {}

        return {
            "question_id": question_id,
            "is_correct": is_correct,
            "score": round(score, 1),
            "correct_answer": question.get("correct_answer"),
            "explanation": question.get("explanation"),
            "feedback": feedback,
            "key_points": question.get("key_points", []),
            "concepts_demonstrated": eval_res.get("concepts_demonstrated", [concept_name]),
            "concepts_missing": eval_res.get("concepts_missing", []),
            "understanding_level": eval_res.get("understanding_level", "moderate" if is_correct else "weak"),
            "suggestion": eval_res.get("suggestion", "Review key concepts in study materials."),
            "mastery_update": {
                "concept": concept_name,
                "old": round(old_mastery, 1),
                "new": round(new_mastery, 1),
                "change": round(new_mastery - old_mastery, 1),
                "trend": trend
            },
            "has_next": has_next
        }

    async def get_next_question(
        self,
        quiz_id: str,
        project_id: str,
        user_id: str,
        question_types: List[str] = None
    ) -> Dict[str, Any]:
        """Generate and return the next adaptive question."""
        if not question_types:
            question_types = ["mcq", "open_ended"]

        return await self._select_next_question(
            quiz_id=quiz_id,
            project_id=project_id,
            user_id=user_id,
            question_types=question_types
        )

    async def complete_quiz(
        self,
        quiz_id: str,
        user_id: str,
        project_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Complete the quiz.
        1. Calculate final score
        2. Update quiz status, score, completed_at
        3. Recalculate project overall_mastery
        4. Generate quiz summary using Gemini
        5. Generate recommendation based on results
        6. Log 'quiz_completed' activity event
        """
        questions = []
        quiz_info = {"total_questions": 5, "correct_answers": 0, "project_id": project_id}

        try:
            if hasattr(self.supabase, "table"):
                qz_res = self.supabase.table("quizzes").select("*").eq("id", quiz_id).execute()
                if qz_res and hasattr(qz_res, "data") and qz_res.data:
                    quiz_info = qz_res.data[0]
                    if not project_id:
                        project_id = quiz_info.get("project_id")

                q_res = self.supabase.table("quiz_questions").select("*").eq("quiz_id", quiz_id).execute()
                if q_res and hasattr(q_res, "data") and q_res.data:
                    questions = q_res.data
        except Exception as err:
            logger.warning(f"[QuizService] complete_quiz DB query notice: {err}")

        total_q = len(questions) if questions else quiz_info.get("total_questions", 5)
        correct_q = sum(1 for q in questions if q.get("is_correct")) if questions else quiz_info.get("correct_answers", 0)
        final_score = round((correct_q / total_q) * 100.0, 1) if total_q > 0 else 0.0

        now = datetime.utcnow().isoformat()

        # Generate summary using Gemini
        topics_str = ", ".join(list({q.get("concept_name", "Concept") for q in questions if q.get("concept_name")}) or ["Core Principles"])
        q_summary_prompt = f"""Summarize a student's performance on a quiz in 2-3 concise, encouraging sentences.
Total Questions: {total_q}
Correct Answers: {correct_q}
Score: {final_score}%
Topics Tested: {topics_str}

Highlight key strengths and 1 specific area to review."""

        ai_summary = f"You completed the assessment with a score of {final_score}%. Great effort demonstrating knowledge in {topics_str}!"
        try:
            ai_summary = await self.gemini.generate_text(q_summary_prompt, max_tokens=150, temperature=0.5)
        except Exception as sum_err:
            logger.warning(f"[QuizService] Summary generation notice: {sum_err}")

        # Update quiz record
        try:
            if hasattr(self.supabase, "table"):
                self.supabase.table("quizzes").update({
                    "score": final_score,
                    "status": "completed",
                    "title": quiz_info.get("title") or f"Quiz Score: {int(final_score)}%",
                    "completed_at": now
                }).eq("id", quiz_id).execute()
        except Exception as qz_up_err:
            logger.warning(f"[QuizService] Quiz completion update notice: {qz_up_err}")

        # Recalculate project overall_mastery
        mastery_changes = []
        if project_id:
            try:
                if hasattr(self.supabase, "table"):
                    c_res = self.supabase.table("concepts").select("id, name").eq("project_id", project_id).execute()
                    if c_res and hasattr(c_res, "data") and c_res.data:
                        mastery_vals = []
                        for c in c_res.data:
                            c_id = c["id"]
                            m_res = self.supabase.table("concept_mastery").select("mastery_level, trend").eq("concept_id", c_id).eq("user_id", user_id).execute()
                            m_lvl = 50.0
                            trend = "stable"
                            if m_res and hasattr(m_res, "data") and m_res.data:
                                m_lvl = float(m_res.data[0].get("mastery_level", 50.0))
                                trend = m_res.data[0].get("trend", "stable")
                            mastery_vals.append(m_lvl)

                            mastery_changes.append({
                                "concept": c["name"],
                                "mastery_level": round(m_lvl, 1),
                                "trend": trend
                            })

                        if mastery_vals:
                            avg_mastery = sum(mastery_vals) / len(mastery_vals)
                            self.supabase.table("projects").update({"overall_mastery": round(avg_mastery, 1)}).eq("id", project_id).execute()
            except Exception as prj_err:
                logger.warning(f"[QuizService] Overall mastery recalculation notice: {prj_err}")

        # Recommendation logic
        recommendation = "Review the weak areas in your Materials tab or start an AI Tutor conversation for a quick refresher."
        if final_score >= 80:
            recommendation = "Excellent performance! Take another hard quiz or explore advanced concept materials."
        elif final_score < 60:
            recommendation = "Focus on reviewing concept definitions in Materials tab before taking another quiz."

        # Log quiz_completed activity event
        try:
            await log_activity(
                self.supabase,
                user_id,
                "quiz_completed",
                project_id=project_id,
                event_data={
                    "quiz_id": quiz_id,
                    "score": final_score,
                    "total_questions": total_q,
                    "correct_answers": correct_q
                }
            )
        except Exception:
            pass

        return {
            "quiz_id": quiz_id,
            "total_questions": total_q,
            "correct_answers": correct_q,
            "score": final_score,
            "mastery_changes": mastery_changes,
            "summary": ai_summary,
            "recommendation": recommendation
        }

    async def get_quiz_history(
        self,
        project_id: str,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """Get all completed quizzes for a project."""
        try:
            if hasattr(self.supabase, "table"):
                res = self.supabase.table("quizzes").select("*").eq("project_id", project_id).eq("user_id", user_id).order("created_at", desc=True).execute()
                if res and hasattr(res, "data") and res.data is not None:
                    return res.data
        except Exception as err:
            logger.warning(f"[QuizService] get_quiz_history notice: {err}")

        return []

    async def get_quiz_detail(
        self,
        quiz_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Get quiz detail with all questions and answers."""
        try:
            if hasattr(self.supabase, "table"):
                qz_res = self.supabase.table("quizzes").select("*").eq("id", quiz_id).execute()
                quiz_data = qz_res.data[0] if (qz_res and hasattr(qz_res, "data") and qz_res.data) else {"id": quiz_id}

                q_res = self.supabase.table("quiz_questions").select("*").eq("quiz_id", quiz_id).order("question_order", desc=False).execute()
                questions = q_res.data if (q_res and hasattr(q_res, "data") and q_res.data) else []

                quiz_data["questions"] = questions
                return quiz_data
        except Exception as err:
            logger.warning(f"[QuizService] get_quiz_detail notice: {err}")

        return {"id": quiz_id, "questions": []}
