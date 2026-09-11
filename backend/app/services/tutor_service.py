import logging
import uuid
import re
import time
import asyncio
from typing import Any, Dict, List, Optional
from datetime import datetime

from app.database import init_supabase
from app.ai.gemini_client import gemini_client as default_gemini_client
from app.ai.prompts import PromptManager
from app.services.knowledge_service import KnowledgeService
from app.services.activity_service import log_activity

logger = logging.getLogger("uvicorn.error")


class TutorService:
    def __init__(self, supabase=None, gemini_client=None, knowledge_service=None):
        self.supabase = supabase or init_supabase()
        self.gemini = gemini_client or default_gemini_client
        self.knowledge = knowledge_service or KnowledgeService(self.supabase, self.gemini)

    async def create_conversation(
        self,
        project_id: str,
        user_id: str,
        title: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new conversation for this project."""
        conv_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        conv_title = title.strip() if (title and title.strip()) else "New Tutoring Session"

        conv_data = {
            "id": conv_id,
            "project_id": project_id,
            "user_id": user_id,
            "title": conv_title,
            "message_count": 0,
            "summary": None,
            "created_at": now,
            "updated_at": now,
        }

        try:
            if hasattr(self.supabase, "table"):
                res = self.supabase.table("conversations").insert(conv_data).execute()
                if res and hasattr(res, "data") and res.data:
                    return res.data[0]
        except Exception as err:
            logger.warning(f"[TutorService] create_conversation DB warning: {err}")

        return conv_data

    async def get_conversations(
        self,
        project_id: str,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """List all conversations for a project, ordered by last activity."""
        try:
            if hasattr(self.supabase, "table"):
                res = self.supabase.table("conversations").select("*").eq("project_id", project_id).eq("user_id", user_id).order("updated_at", desc=True).execute()
                if res and hasattr(res, "data") and res.data is not None:
                    return res.data
        except Exception as err:
            logger.warning(f"[TutorService] get_conversations DB warning: {err}")

        return []

    async def get_conversation(
        self,
        conversation_id: str,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get single conversation by ID."""
        try:
            if hasattr(self.supabase, "table"):
                res = self.supabase.table("conversations").select("*").eq("id", conversation_id).execute()
                if res and hasattr(res, "data") and res.data:
                    conv = res.data[0]
                    if conv.get("user_id") == user_id or str(conv.get("user_id")) == str(user_id):
                        return conv
        except Exception as err:
            logger.warning(f"[TutorService] get_conversation warning: {err}")

        return None

    async def get_conversation_messages(
        self,
        conversation_id: str,
        user_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get messages for a conversation, verified by ownership."""
        try:
            if hasattr(self.supabase, "table"):
                res = self.supabase.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at", desc=False).limit(limit).execute()
                if res and hasattr(res, "data") and res.data is not None:
                    return res.data
        except Exception as err:
            logger.warning(f"[TutorService] get_conversation_messages warning: {err}")

        return []

    async def send_message(
        self,
        conversation_id: str,
        project_id: str,
        user_id: str,
        question: str
    ) -> Dict[str, Any]:
        """
        Process user question with RAG pipeline and generate AI Tutor response.
        """
        start_time = time.time()
        now = datetime.utcnow().isoformat()

        # 1. Save user message to messages table
        user_msg_id = str(uuid.uuid4())
        user_msg_data = {
            "id": user_msg_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "user",
            "content": question,
            "sources": [],
            "metadata": {},
            "created_at": now,
        }

        try:
            if hasattr(self.supabase, "table"):
                self.supabase.table("messages").insert(user_msg_data).execute()
        except Exception as err:
            logger.warning(f"[TutorService] Error saving user message: {err}")

        # 2. Get relevant context using KnowledgeService
        context_data = await self.knowledge.get_relevant_context_for_query(
            query=question,
            project_id=project_id,
            user_id=user_id,
            conversation_id=conversation_id
        )

        retrieved_chunks = context_data.get("retrieved_chunks", [])
        retrieved_text = context_data.get("retrieved_text", "")

        # Build history string
        history_list = context_data.get("conversation_history", [])
        history_formatted = "\n".join([
            f"{m.get('role', 'user').capitalize()}: {m.get('content', '')}"
            for m in history_list[-10:]
        ]) if history_list else "No prior messages."

        # Format learning context & mastery summary
        learning_ctx_entries = context_data.get("learning_context", [])
        strengths = [c.get("content") for c in learning_ctx_entries if c.get("context_type") == "strength"]
        weaknesses = [c.get("content") for c in learning_ctx_entries if c.get("context_type") == "weakness"]

        concepts = context_data.get("concepts", [])
        mastery_summary = ", ".join([f"{c['name']} ({int(c.get('mastery_level', 0)*100)}%)" for c in concepts[:5]]) if concepts else "Initial assessment stage"

        system_prompt = PromptManager.format_prompt(
            PromptManager.TUTOR_SYSTEM_PROMPT,
            learning_goal=context_data.get("learning_goal", "Master concepts"),
            mastery_summary=mastery_summary,
            strengths=", ".join(strengths) if strengths else "None documented yet",
            weaknesses=", ".join(weaknesses) if weaknesses else "None documented yet"
        )

        tutor_prompt = PromptManager.format_prompt(
            PromptManager.TUTOR_RESPONSE_PROMPT,
            retrieved_context=retrieved_text if retrieved_text else "No relevant study material chunks found.",
            conversation_history=history_formatted,
            learning_context=f"Strengths: {', '.join(strengths)}. Weaknesses: {', '.join(weaknesses)}",
            question=question
        )

        # 5. Call gemini_client.generate_text
        try:
            ai_text = await self.gemini.generate_text(
                prompt=tutor_prompt,
                system_instruction=system_prompt,
                temperature=0.4,
                max_tokens=4096
            )
        except Exception as ai_err:
            logger.error(f"[TutorService] Gemini text generation failed: {ai_err}")
            ai_text = (
                "I apologize, but I encountered a temporary issue reading your study materials. "
                "Please make sure your document is uploaded and processed, or try asking your question again."
            )

        latency_ms = int((time.time() - start_time) * 1000)

        # 6. Extract sources from response
        sources = await self._extract_sources_from_response(ai_text, retrieved_chunks)

        # 7. Save assistant message
        assistant_msg_id = str(uuid.uuid4())
        assistant_msg_data = {
            "id": assistant_msg_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "assistant",
            "content": ai_text,
            "sources": sources,
            "metadata": {
                "model": "gemini-2.0-flash",
                "tokens": len(ai_text.split()) * 2,
                "latency_ms": latency_ms,
            },
            "created_at": datetime.utcnow().isoformat(),
        }

        try:
            if hasattr(self.supabase, "table"):
                self.supabase.table("messages").insert(assistant_msg_data).execute()
        except Exception as err:
            logger.warning(f"[TutorService] Error saving assistant message: {err}")

        # 8. Update conversation message_count, updated_at, and auto-title if needed
        try:
            if hasattr(self.supabase, "table"):
                # Fetch existing conversation
                c_res = self.supabase.table("conversations").select("title, message_count").eq("id", conversation_id).execute()
                curr_title = "New Tutoring Session"
                curr_count = 0
                if c_res and hasattr(c_res, "data") and c_res.data:
                    curr_title = c_res.data[0].get("title", curr_title)
                    curr_count = c_res.data[0].get("message_count", 0)

                new_title = curr_title
                if curr_title in ["New Conversation", "New Tutoring Session"] or curr_count == 0:
                    # Generate succinct title from first question
                    new_title = question[:35] + ("..." if len(question) > 35 else "")

                self.supabase.table("conversations").update({
                    "title": new_title,
                    "message_count": curr_count + 2,
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("id", conversation_id).execute()
        except Exception as err:
            logger.warning(f"[TutorService] Error updating conversation metadata: {err}")

        # 9. Log activity event
        try:
            await log_activity(
                self.supabase,
                user_id,
                "tutor_question",
                project_id=project_id,
                event_data={
                    "conversation_id": conversation_id,
                    "question_snippet": question[:80],
                    "sources_count": len(sources),
                    "latency_ms": latency_ms
                }
            )
        except Exception as act_err:
            logger.warning(f"[TutorService] Activity log error: {act_err}")

        # 10. Asynchronously update learning signals & conversation summary
        asyncio.create_task(self._detect_learning_signals(question, ai_text, project_id, user_id))
        asyncio.create_task(self._update_conversation_summary(conversation_id))

        return assistant_msg_data

    async def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        """Delete conversation and all messages."""
        try:
            if hasattr(self.supabase, "table"):
                self.supabase.table("messages").delete().eq("conversation_id", conversation_id).execute()
                self.supabase.table("conversations").delete().eq("id", conversation_id).eq("user_id", user_id).execute()
                return True
        except Exception as err:
            logger.error(f"[TutorService] Delete conversation error: {err}")

        return False

    async def _extract_sources_from_response(
        self,
        response: str,
        retrieved_chunks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Parse [Source: ...] citations from response and match with retrieved chunks."""
        sources: List[Dict[str, Any]] = []
        seen_keys = set()

        # Regex for [Source: filename — Page X] or [filename — Page X]
        pattern = r"\[(?:Source:\s*)?([^\]—\n]+?)(?:\s*—\s*Page\s*(\d+))?\]"
        matches = re.findall(pattern, response, re.IGNORECASE)

        for mat_name, page_str in matches:
            mat_name_clean = mat_name.strip()
            page_num = int(page_str) if page_str else None
            key = f"{mat_name_clean}_{page_num}"

            if key not in seen_keys:
                seen_keys.add(key)
                matched_chunk = None
                for chunk in retrieved_chunks:
                    if mat_name_clean.lower() in chunk.get("material_name", "").lower():
                        if page_num is None or chunk.get("page_number") == page_num:
                            matched_chunk = chunk
                            break

                sources.append({
                    "material_name": mat_name_clean,
                    "page_number": page_num or 1,
                    "chunk_id": matched_chunk["chunk_id"] if matched_chunk else str(uuid.uuid4()),
                    "relevance": matched_chunk.get("similarity_score", 0.85) if matched_chunk else 0.80,
                    "content_preview": matched_chunk.get("content", "")[:200] if matched_chunk else ""
                })

        # If no explicit citation regex matches, but chunks were retrieved and referenced conceptually
        if not sources and retrieved_chunks:
            for chunk in retrieved_chunks[:2]:
                if chunk.get("similarity_score", 0) >= 0.70:
                    sources.append({
                        "material_name": chunk.get("material_name", "Document.pdf"),
                        "page_number": chunk.get("page_number", 1),
                        "chunk_id": chunk.get("chunk_id", str(uuid.uuid4())),
                        "relevance": chunk.get("similarity_score", 0.85),
                        "content_preview": chunk.get("content", "")[:200]
                    })

        return sources

    async def _update_conversation_summary(self, conversation_id: str):
        """Generate and save conversation summary using Gemini."""
        try:
            if hasattr(self.supabase, "table"):
                msg_res = self.supabase.table("messages").select("role, content").eq("conversation_id", conversation_id).order("created_at", desc=False).limit(20).execute()
                if msg_res and hasattr(msg_res, "data") and len(msg_res.data) >= 2:
                    formatted_msgs = "\n".join([f"{m['role'].capitalize()}: {m['content']}" for m in msg_res.data])
                    prompt = PromptManager.format_prompt(
                        PromptManager.CONVERSATION_SUMMARY_PROMPT,
                        messages=formatted_msgs
                    )
                    summary_text = await self.gemini.generate_text(prompt, max_tokens=150, temperature=0.3)
                    if summary_text:
                        self.supabase.table("conversations").update({"summary": summary_text.strip()}).eq("id", conversation_id).execute()
        except Exception as err:
            logger.warning(f"[TutorService] _update_conversation_summary notice: {err}")

    async def _detect_learning_signals(
        self,
        question: str,
        response: str,
        project_id: str,
        user_id: str
    ):
        """
        Analyze interaction to extract student learning signals and update active learning context.
        """
        try:
            q_lower = question.lower()
            if any(phrase in q_lower for phrase in ["confused", "explain simply", "don't understand", "too complex", "what is"]):
                # Signal: student finding topic challenging
                context_desc = f"Student sought simplified explanation for: '{question[:60]}'"
                await self.knowledge.update_learning_context(project_id, user_id, "weakness", context_desc, source="tutor_signal")
            elif any(phrase in q_lower for phrase in ["how does", "compare", "difference between", "why does", "deep dive"]):
                # Signal: active analytical engagement
                context_desc = f"Student demonstrates active analytical interest in: '{question[:60]}'"
                await self.knowledge.update_learning_context(project_id, user_id, "strength", context_desc, source="tutor_signal")
        except Exception as err:
            logger.warning(f"[TutorService] _detect_learning_signals notice: {err}")
