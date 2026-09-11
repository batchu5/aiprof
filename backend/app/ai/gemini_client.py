import logging
import time
import json
from typing import Optional, List, Dict, Any
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger("uvicorn.error")

# Configure Gemini API Key
if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your-gemini-api-key":
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        logger.info("Google Generative AI SDK configured successfully.")
    except Exception as e:
        logger.error(f"Failed to configure Gemini SDK: {e}")


def log_ai_usage(
    supabase_client: Any,
    feature: str,
    model_name: str,
    input_tokens: int = 0,
    output_tokens: int = 0,
    latency_ms: int = 0,
    status_str: str = "success",
    error_msg: Optional[str] = None,
    user_id: Optional[str] = None,
    project_id: Optional[str] = None,
):
    """Safely logs AI usage to ai_usage_logs table."""
    try:
        if hasattr(supabase_client, "table"):
            supabase_client.table("ai_usage_logs").insert({
                "user_id": user_id,
                "project_id": project_id,
                "feature": feature,
                "model": model_name,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "latency_ms": latency_ms,
                "estimated_cost": 0.0,
                "status": status_str,
                "error_message": error_msg,
            }).execute()
    except Exception as err:
        logger.warning(f"Could not log AI usage: {err}")


class GeminiClient:
    def __init__(self, model_name: str = "gemini-1.5-flash"):
        self.model_name = model_name

    def _execute_with_retry(self, func, max_retries: int = 3, initial_delay: float = 1.0):
        delay = initial_delay
        last_exception = None
        for attempt in range(max_retries):
            try:
                return func()
            except Exception as e:
                last_exception = e
                logger.warning(f"Gemini API attempt {attempt + 1} failed: {e}. Retrying in {delay}s...")
                time.sleep(delay)
                delay *= 2
        raise last_exception

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 8192,
        supabase_client: Any = None,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        feature: str = "generate_text"
    ) -> Optional[str]:
        start_time = time.time()
        model_name = self.model_name
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction
            )
            
            def _call():
                return model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=temperature,
                        max_output_tokens=max_tokens
                    )
                )

            res = self._execute_with_retry(_call)
            latency = int((time.time() - start_time) * 1000)

            in_tokens = getattr(res.usage_metadata, "prompt_token_count", 0) if hasattr(res, "usage_metadata") else 0
            out_tokens = getattr(res.usage_metadata, "candidates_token_count", 0) if hasattr(res, "usage_metadata") else 0

            log_ai_usage(supabase_client, feature, model_name, in_tokens, out_tokens, latency, "success", user_id=user_id, project_id=project_id)
            return res.text
        except Exception as e:
            latency = int((time.time() - start_time) * 1000)
            logger.error(f"Error in generate_text: {e}")
            log_ai_usage(supabase_client, feature, model_name, 0, 0, latency, "error", str(e), user_id=user_id, project_id=project_id)
            return None

    async def generate_structured(
        self,
        prompt: str,
        response_schema: Optional[Any] = None,
        system_instruction: Optional[str] = None,
        supabase_client: Any = None,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        feature: str = "structured_generation"
    ) -> Optional[Any]:
        start_time = time.time()
        model_name = self.model_name
        try:
            system_prompt = f"{system_instruction}\nRespond ONLY in valid JSON format." if system_instruction else "Respond ONLY in valid JSON format."
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_prompt
            )

            def _call():
                return model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )

            res = self._execute_with_retry(_call)
            latency = int((time.time() - start_time) * 1000)

            in_tokens = getattr(res.usage_metadata, "prompt_token_count", 0) if hasattr(res, "usage_metadata") else 0
            out_tokens = getattr(res.usage_metadata, "candidates_token_count", 0) if hasattr(res, "usage_metadata") else 0

            log_ai_usage(supabase_client, feature, model_name, in_tokens, out_tokens, latency, "success", user_id=user_id, project_id=project_id)
            return json.loads(res.text)
        except Exception as e:
            latency = int((time.time() - start_time) * 1000)
            logger.error(f"Error in generate_structured: {e}")
            log_ai_usage(supabase_client, feature, model_name, 0, 0, latency, "error", str(e), user_id=user_id, project_id=project_id)
            return None

    async def generate_embedding(self, text: str, supabase_client: Any = None) -> List[float]:
        start_time = time.time()
        try:
            def _call():
                return genai.embed_content(
                    model="models/text-embedding-004",
                    content=text,
                    task_type="retrieval_document"
                )
            res = self._execute_with_retry(_call)
            latency = int((time.time() - start_time) * 1000)
            log_ai_usage(supabase_client, "embedding", "text-embedding-004", len(text.split()), 0, latency, "success")
            return res["embedding"]
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            # Return 768-dim zero vector fallback
            return [0.0] * 768

    async def generate_embeddings_batch(self, texts: List[str], supabase_client: Any = None) -> List[List[float]]:
        embeddings = []
        for text in texts:
            emb = await self.generate_embedding(text, supabase_client)
            embeddings.append(emb)
        return embeddings

    async def analyze_image(
        self,
        image_bytes: bytes,
        prompt: str = "Extract all readable text from this document image cleanly.",
        supabase_client: Any = None
    ) -> str:
        start_time = time.time()
        model_name = "gemini-1.5-flash"
        try:
            model = genai.GenerativeModel(model_name)
            image_part = {
                "mime_type": "image/png",
                "data": image_bytes
            }

            def _call():
                return model.generate_content([image_part, prompt])

            res = self._execute_with_retry(_call)
            latency = int((time.time() - start_time) * 1000)
            log_ai_usage(supabase_client, "ocr_vision", model_name, 100, 100, latency, "success")
            return res.text
        except Exception as e:
            logger.error(f"Error in analyze_image OCR: {e}")
            return ""


# Singleton GeminiClient instance
gemini_client = GeminiClient()
