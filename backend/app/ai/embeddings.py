import logging
from typing import List
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger("uvicorn.error")


async def generate_embedding(text: str) -> List[float]:
    """
    Generate vector embeddings using Gemini text-embedding-004
    """
    try:
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your-gemini-api-key":
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        # Return fallback mock vector (768 dimensions for pgvector)
        return [0.01 * (i % 10) for i in range(768)]
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        return [0.0] * 768
