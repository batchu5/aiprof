from fastapi import APIRouter, Depends
from app.schemas.analytics import AnalyticsSummaryResponse
from app.dependencies import get_current_user
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=AnalyticsSummaryResponse)
async def get_analytics(current_user=Depends(get_current_user)):
    user_id = current_user.get("sub", "usr_1")
    data = await AnalyticsService.get_user_analytics(user_id)
    return AnalyticsSummaryResponse(**data)
