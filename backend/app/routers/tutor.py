import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.dependencies import get_current_user, verify_project_access
from app.database import get_supabase
from app.services.tutor_service import TutorService
from app.ai.gemini_client import gemini_client

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/projects/{project_id}/conversations", tags=["Tutor & Conversations"])


class ConversationCreatePayload(BaseModel):
    title: Optional[str] = Field(None, description="Optional custom title for the conversation")


class MessageSendPayload(BaseModel):
    content: str = Field(..., min_length=1, description="The user's question or message")




@router.post("")
async def create_conversation(
    project_id: str,
    payload: Optional[ConversationCreatePayload] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Create a new AI Tutor conversation for a project.
    """
    user_id = current_user["id"]
    await verify_project_access(project_id, user_id, supabase_client, current_user)

    title = payload.title if payload else None
    tutor_svc = TutorService(supabase=supabase_client, gemini_client=gemini_client)
    conv = await tutor_svc.create_conversation(project_id=project_id, user_id=user_id, title=title)

    return {"success": True, "data": conv}


@router.get("")
async def list_conversations(
    project_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    List all conversations for a project, ordered by latest activity.
    """
    user_id = current_user["id"]
    await verify_project_access(project_id, user_id, supabase_client, current_user)

    tutor_svc = TutorService(supabase=supabase_client, gemini_client=gemini_client)
    conversations = await tutor_svc.get_conversations(project_id=project_id, user_id=user_id)

    return {"success": True, "data": conversations}


@router.get("/{conversation_id}")
async def get_conversation_details(
    project_id: str,
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Get detailed conversation metadata and full message history.
    """
    user_id = current_user["id"]
    await verify_project_access(project_id, user_id, supabase_client, current_user)

    tutor_svc = TutorService(supabase=supabase_client, gemini_client=gemini_client)
    conv = await tutor_svc.get_conversation(conversation_id=conversation_id, user_id=user_id)
    if not conv:
        # Fallback conv structure if missing
        conv = {
            "id": conversation_id,
            "project_id": project_id,
            "user_id": user_id,
            "title": "Tutoring Session",
            "message_count": 0
        }

    messages = await tutor_svc.get_conversation_messages(conversation_id=conversation_id, user_id=user_id)
    conv["messages"] = messages

    return {"success": True, "data": conv}


@router.post("/{conversation_id}/messages")
async def send_tutor_message(
    project_id: str,
    conversation_id: str,
    payload: MessageSendPayload,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Send a message to the AI Tutor and receive a grounded response with source citations.
    """
    user_id = current_user["id"]
    await verify_project_access(project_id, user_id, supabase_client, current_user)

    if not payload.content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty"
        )

    tutor_svc = TutorService(supabase=supabase_client, gemini_client=gemini_client)
    assistant_msg = await tutor_svc.send_message(
        conversation_id=conversation_id,
        project_id=project_id,
        user_id=user_id,
        question=payload.content.strip()
    )

    return {"success": True, "data": assistant_msg}


@router.delete("/{conversation_id}")
async def delete_conversation(
    project_id: str,
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    """
    Delete a conversation and all associated messages.
    """
    user_id = current_user["id"]
    await verify_project_access(project_id, user_id, supabase_client, current_user)

    tutor_svc = TutorService(supabase=supabase_client, gemini_client=gemini_client)
    success = await tutor_svc.delete_conversation(conversation_id=conversation_id, user_id=user_id)

    return {"success": success, "data": {"message": "Conversation deleted successfully"}}
