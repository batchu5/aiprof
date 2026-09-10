from app.ai.gemini_client import generate_response
from app.ai.prompts import SUMMARY_PROMPT


class AIService:
    @staticmethod
    async def summarize_text(text: str) -> str:
        return await generate_response(prompt=text[:3000], system_instruction=SUMMARY_PROMPT)
