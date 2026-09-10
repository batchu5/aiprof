from typing import Dict, Any
from fastapi import APIRouter, Depends
from app.dependencies import get_admin_user

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
async def get_admin_stats(admin_user=Depends(get_admin_user)):
    return {
        "total_users": 142,
        "active_spaces": 68,
        "vector_chunks": 1204,
        "gemini_api_status": "Healthy",
    }
