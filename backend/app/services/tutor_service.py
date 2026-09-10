from app.ai.gemini_client import generate_response
from app.ai.prompts import TUTOR_SYSTEM_PROMPT
from app.services.knowledge_service import KnowledgeService


class TutorService:
    @staticmethod
    async def chat_with_tutor(project_id: str, user_query: str) -> str:
        # Retrieve context using RAG
        context = await KnowledgeService.retrieve_relevant_context(project_id, user_query)
        
        prompt = f"Study Material Context:\n{context}\n\nUser Question: {user_query}"
        response = await generate_response(prompt=prompt, system_instruction=TUTOR_SYSTEM_PROMPT)
        return response
