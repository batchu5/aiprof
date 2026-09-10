from datetime import datetime
from fastapi import APIRouter, Depends
from app.schemas.conversation import MessagePayload, MessageResponse
from app.dependencies import get_current_user
from app.services.tutor_service import TutorService

router = APIRouter(prefix="/tutor", tags=["Tutor"])


@router.post("/chat", response_model=MessageResponse)
async def chat_tutor(payload: MessagePayload, current_user=Depends(get_current_user)):
    reply_text = await TutorService.chat_with_tutor(payload.project_id, payload.message)
    return MessageResponse(
        id=f"msg_{datetime.utcnow().timestamp()}",
        sender="ai",
        text=reply_text,
        timestamp=datetime.utcnow()
    )
