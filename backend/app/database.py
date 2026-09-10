import logging
from typing import Generator, Any
from app.config import settings

logger = logging.getLogger("uvicorn.error")

_supabase_client: Any = None


class DummySupabaseClient:
    """Mock Supabase Client fallback when API key is unconfigured or invalid in dev environment."""
    def table(self, name: str):
        return self

    def select(self, *args, **kwargs):
        return self

    def insert(self, *args, **kwargs):
        return self

    def update(self, *args, **kwargs):
        return self

    def delete(self, *args, **kwargs):
        return self

    def execute(self):
        return {"data": [], "error": None}


def init_supabase() -> Any:
    global _supabase_client
    if _supabase_client is None:
        try:
            from supabase import create_client
            # Check if key is configured and not default placeholder
            if (
                settings.SUPABASE_KEY
                and settings.SUPABASE_KEY != "your-supabase-anon-key"
                and len(settings.SUPABASE_KEY) > 10
            ):
                _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                logger.info("Supabase client successfully initialized.")
            else:
                logger.warning("Supabase key is missing or using default placeholder. Running with mock DB client.")
                _supabase_client = DummySupabaseClient()
        except Exception as e:
            logger.warning(f"Could not connect to Supabase ({e}). Running in dev mode with mock DB client.")
            _supabase_client = DummySupabaseClient()
    return _supabase_client


def get_supabase() -> Generator[Any, None, None]:
    client = init_supabase()
    yield client
