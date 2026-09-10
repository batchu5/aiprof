import logging
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger("uvicorn.error")

try:
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your-gemini-api-key":
        genai.configure(api_key=settings.GEMINI_API_KEY)
        logger.info("Google Gemini API client initialized.")
    else:
        logger.warning("GEMINI_API_KEY is using default placeholder.")
except Exception as e:
    logger.error(f"Error configuring Gemini API: {e}")


def get_gemini_model(model_name: str = "gemini-1.5-flash"):
    try:
        return genai.GenerativeModel(model_name)
    except Exception as e:
        logger.error(f"Failed to load model {model_name}: {e}")
        return None


async def generate_response(prompt: str, system_instruction: str = None) -> str:
    try:
        model = get_gemini_model("gemini-1.5-flash")
        if not model:
            return "AI Service Unavailable: Please ensure GEMINI_API_KEY is configured properly."
        
        full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
        response = model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error generating Gemini response: {e}")
        return f"Simulated Gemini Response: Understood your query about '{prompt[:50]}...'."
