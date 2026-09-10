from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.services.mastery_service import MasteryService

router = APIRouter(prefix="/mastery", tags=["Mastery"])


@router.get("", response_model=List[Dict[str, Any]])
async def get_mastery(current_user=Depends(get_current_user)):
    user_id = current_user.get("sub", "usr_1")
    return await MasteryService.get_user_mastery(user_id)
