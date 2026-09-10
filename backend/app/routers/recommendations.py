from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("", response_model=List[Dict[str, Any]])
async def get_recommendations(current_user=Depends(get_current_user)):
    user_id = current_user.get("sub", "usr_1")
    return await RecommendationService.get_study_recommendations(user_id)
