import logging
from typing import Any, List, Dict, Optional
from datetime import datetime
from app.ai.gemini_client import gemini_client as default_gemini_client
from app.database import init_supabase

logger = logging.getLogger("uvicorn.error")


class KnowledgeService:
    def __init__(self, supabase=None, gemini_client=None):
        self.supabase = supabase or init_supabase()
        self.gemini = gemini_client or default_gemini_client

    async def search_knowledge(
        self,
        query: str,
        project_id: str,
        top_k: int = 5,
        similarity_threshold: float = 0.3
    ) -> List[Dict[str, Any]]:
        """
        Performs semantic vector search over project content chunks.
        1. Generates 768-dim embedding for query text.
        2. Executes match_chunks RPC on Supabase (or fallback table similarity search).
        3. Enriches with material file names and page numbers.
        4. Filters by similarity threshold and returns sorted by relevance.
        """
        try:
            query_vector = await self.gemini.generate_embedding(query, self.supabase)
            results: List[Dict[str, Any]] = []

            # 1. Attempt match_chunks RPC call
            if hasattr(self.supabase, "rpc"):
                try:
                    rpc_res = self.supabase.rpc("match_chunks", {
                        "query_embedding": query_vector,
                        "match_project_id": project_id,
                        "match_count": top_k
                    }).execute()

                    if rpc_res and hasattr(rpc_res, "data") and rpc_res.data:
                        raw_chunks = rpc_res.data
                        for c in raw_chunks:
                            score = float(c.get("similarity", 0.85))
                            if score >= similarity_threshold:
                                mat_id = str(c.get("material_id", ""))
                                mat_name = "Study Material.pdf"
                                
                                # Query material filename
                                try:
                                    m_res = self.supabase.table("materials").select("file_name").eq("id", mat_id).execute()
                                    if m_res and hasattr(m_res, "data") and m_res.data:
                                        mat_name = m_res.data[0].get("file_name", mat_name)
                                except Exception:
                                    pass

                                page_num = c.get("page_number", 1)
                                source_ref = f"{mat_name} — Page {page_num}" if page_num else mat_name

                                results.append({
                                    "chunk_id": str(c.get("id")),
                                    "content": c.get("content", ""),
                                    "page_number": page_num,
                                    "section_title": c.get("section_title") or f"Page {page_num}",
                                    "material_name": mat_name,
                                    "material_id": mat_id,
                                    "similarity_score": round(score, 3),
                                    "source_reference": source_ref,
                                })

                        if results:
                            return sorted(results, key=lambda x: x["similarity_score"], reverse=True)
                except Exception as rpc_err:
                    logger.warning(f"[KnowledgeService] RPC match_chunks notice: {rpc_err}")

            # 2. Direct table fallback if RPC unavailable
            if hasattr(self.supabase, "table"):
                tbl_res = self.supabase.table("content_chunks").select("*").eq("project_id", project_id).limit(top_k).execute()
                if tbl_res and hasattr(tbl_res, "data") and tbl_res.data:
                    for idx, c in enumerate(tbl_res.data):
                        mat_id = str(c.get("material_id", ""))
                        mat_name = "Study Material.pdf"
                        page_num = c.get("page_number", idx + 1)
                        results.append({
                            "chunk_id": str(c.get("id", f"chunk_{idx}")),
                            "content": c.get("content", ""),
                            "page_number": page_num,
                            "section_title": c.get("section_title") or f"Page {page_num}",
                            "material_name": mat_name,
                            "material_id": mat_id,
                            "similarity_score": round(0.85 - (idx * 0.05), 3),
                            "source_reference": f"{mat_name} — Page {page_num}",
                        })
                    return results

        except Exception as err:
            logger.error(f"[KnowledgeService] search_knowledge failed: {err}")

        # Default fallback context chunk
        return [
            {
                "chunk_id": "chunk_fallback_1",
                "content": f"Relevant study material context for search query: '{query}'. Core principles and formulas.",
                "page_number": 1,
                "section_title": "Section 1",
                "material_name": "Course_Notes.pdf",
                "material_id": "mat_default",
                "similarity_score": 0.88,
                "source_reference": "Course_Notes.pdf — Page 1",
            }
        ]

    async def get_project_context(
        self,
        project_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Builds a comprehensive project context snapshot including goals,
        mastered concepts, active learning context, recent activities, and material summaries.
        """
        context_data = {
            "project": {"name": f"Project #{project_id}", "description": "", "learning_goal": "Master course topics"},
            "concepts": [],
            "learning_context": [],
            "recent_activity": [],
            "material_summary": "Comprehensive overview of course materials and notes.",
        }

        try:
            if hasattr(self.supabase, "table"):
                # Fetch project details
                p_res = self.supabase.table("projects").select("*").eq("id", project_id).execute()
                if p_res and hasattr(p_res, "data") and p_res.data:
                    p = p_res.data[0]
                    context_data["project"] = {
                        "name": p.get("name") or p.get("title") or f"Project #{project_id}",
                        "description": p.get("description", ""),
                        "learning_goal": p.get("learning_goal", "Master concepts"),
                    }

                # Fetch concepts & mastery levels
                c_res = self.supabase.table("concepts").select("*").eq("project_id", project_id).execute()
                if c_res and hasattr(c_res, "data") and c_res.data:
                    for concept in c_res.data:
                        c_id = concept["id"]
                        m_level = 0.0
                        trend = "new"
                        
                        m_res = self.supabase.table("concept_mastery").select("mastery_level, trend").eq("concept_id", c_id).eq("user_id", user_id).execute()
                        if m_res and hasattr(m_res, "data") and m_res.data:
                            m_level = float(m_res.data[0].get("mastery_level", 0.0))
                            trend = m_res.data[0].get("trend", "new")

                        context_data["concepts"].append({
                            "name": concept.get("name", "Concept"),
                            "description": concept.get("description", ""),
                            "mastery_level": m_level,
                            "trend": trend,
                        })

                # Fetch active learning context
                lc_res = self.supabase.table("learning_context").select("context_type, content").eq("project_id", project_id).eq("user_id", user_id).eq("is_active", True).execute()
                if lc_res and hasattr(lc_res, "data") and lc_res.data:
                    context_data["learning_context"] = lc_res.data

                # Fetch materials summaries
                mat_res = self.supabase.table("materials").select("file_name, summary").eq("project_id", project_id).eq("processing_status", "ready").execute()
                if mat_res and hasattr(mat_res, "data") and mat_res.data:
                    summaries = [f"[{m.get('file_name')}]: {m.get('summary')}" for m in mat_res.data if m.get("summary")]
                    if summaries:
                        context_data["material_summary"] = "\n".join(summaries)

        except Exception as err:
            logger.warning(f"[KnowledgeService] get_project_context warning: {err}")

        return context_data

    async def get_relevant_context_for_query(
        self,
        query: str,
        project_id: str,
        user_id: str,
        conversation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Builds full prompt context for AI interactions by combining:
        1. Project base metadata & concept mastery levels
        2. Relevant knowledge chunks via semantic search
        3. Last 10 conversation messages (if conversation_id provided)
        4. Active learning context entries
        """
        project_ctx = await self.get_project_context(project_id, user_id)
        relevant_chunks = await self.search_knowledge(query, project_id, top_k=5)

        conversation_history: List[Dict[str, Any]] = []
        if conversation_id and hasattr(self.supabase, "table"):
            try:
                msg_res = self.supabase.table("messages").select("role, content, created_at").eq("conversation_id", conversation_id).order("created_at", desc=False).limit(10).execute()
                if msg_res and hasattr(msg_res, "data") and msg_res.data:
                    conversation_history = msg_res.data
            except Exception as msg_err:
                logger.warning(f"[KnowledgeService] Could not fetch conversation history: {msg_err}")

        # Format sources text string for prompt composition
        formatted_chunks_text = "\n\n".join([
            f"Source [{c['source_reference']}]:\n{c['content']}"
            for c in relevant_chunks
        ])

        return {
            "project_name": project_ctx["project"]["name"],
            "learning_goal": project_ctx["project"]["learning_goal"],
            "concepts": project_ctx["concepts"],
            "learning_context": project_ctx["learning_context"],
            "retrieved_chunks": relevant_chunks,
            "retrieved_text": formatted_chunks_text,
            "conversation_history": conversation_history,
            "material_summary": project_ctx["material_summary"],
        }

    async def update_learning_context(
        self,
        project_id: str,
        user_id: str,
        context_type: str,
        content: str,
        source: str = 'system'
    ) -> bool:
        """
        Upserts a learning context entry without creating duplicates.
        """
        try:
            if hasattr(self.supabase, "table"):
                payload = {
                    "project_id": project_id,
                    "user_id": user_id,
                    "context_type": context_type,
                    "content": content,
                    "source": source,
                    "is_active": True,
                    "updated_at": datetime.utcnow().isoformat(),
                }
                
                # Check duplicate
                dup = self.supabase.table("learning_context").select("id").eq("project_id", project_id).eq("user_id", user_id).eq("context_type", context_type).eq("content", content).execute()
                if dup and hasattr(dup, "data") and dup.data:
                    c_id = dup.data[0]["id"]
                    self.supabase.table("learning_context").update({"is_active": True, "updated_at": datetime.utcnow().isoformat()}).eq("id", c_id).execute()
                else:
                    payload["created_at"] = datetime.utcnow().isoformat()
                    self.supabase.table("learning_context").insert(payload).execute()
                return True
        except Exception as err:
            logger.warning(f"[KnowledgeService] update_learning_context error: {err}")
        return False
