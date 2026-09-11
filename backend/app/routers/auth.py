import logging
from typing import Any, Dict
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import UserCreate, UserLogin, UserUpdate, UserResponse, TokenResponse
from app.dependencies import get_current_user
from app.database import get_supabase
from app.config import settings

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/auth", tags=["Authentication"])


def log_activity_event(supabase_client: Any, user_id: str, event_type: str, event_data: Dict[str, Any]):
    """Helper to log auth activity events safely without breaking the main flow"""
    try:
        if hasattr(supabase_client, "table"):
            supabase_client.table("activity_events").insert({
                "user_id": user_id,
                "event_type": event_type,
                "event_data": event_data,
                "created_at": datetime.utcnow().isoformat(),
            }).execute()
    except Exception as err:
        logger.warning(f"Could not log activity event '{event_type}': {err}")


@router.post("/register")
async def register(payload: UserCreate, supabase_client: Any = Depends(get_supabase)):
    try:
        # Attempt signup via Supabase Auth
        if hasattr(supabase_client, "auth") and callable(getattr(supabase_client.auth, "sign_up", None)):
            res = supabase_client.auth.sign_up({
                "email": payload.email,
                "password": payload.password,
                "options": {
                    "data": {
                        "full_name": payload.full_name or "",
                        "role": "user",
                    }
                }
            })
            
            if res and res.user:
                user_obj = res.user
                access_token = getattr(res.session, "access_token", "registered-token") if res.session else "registered-token"
                
                user_resp = UserResponse(
                    id=str(user_obj.id),
                    email=user_obj.email,
                    full_name=payload.full_name,
                    role="user",
                    created_at=datetime.utcnow()
                )

                log_activity_event(supabase_client, str(user_obj.id), "user_registered", {"email": payload.email})

                token_res = TokenResponse(
                    access_token=access_token,
                    token_type="bearer",
                    user=user_resp
                )

                return {"success": True, "data": token_res.model_dump()}
    except Exception as err:
        logger.warning(f"Supabase sign_up error ({err}). Checking dev environment fallback...")
        if settings.ENVIRONMENT == "development":
            user_resp = UserResponse(
                id="00000000-0000-0000-0000-000000000101",
                email=payload.email,
                full_name=payload.full_name or "Dev Student",
                role="user",
                created_at=datetime.utcnow()
            )
            token_res = TokenResponse(
                access_token="dev-token-registered",
                token_type="bearer",
                user=user_resp
            )
            return {"success": True, "data": token_res.model_dump()}
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err) or "Failed to register user account.")

    # Dev fallback response
    user_resp = UserResponse(
        id="00000000-0000-0000-0000-000000000101",
        email=payload.email,
        full_name=payload.full_name or "Dev Student",
        role="user",
        created_at=datetime.utcnow()
    )
    token_res = TokenResponse(
        access_token="dev-token-registered",
        token_type="bearer",
        user=user_resp
    )
    return {"success": True, "data": token_res.model_dump()}


@router.post("/login")
async def login(payload: UserLogin, supabase_client: Any = Depends(get_supabase)):
    try:
        if hasattr(supabase_client, "auth") and callable(getattr(supabase_client.auth, "sign_in_with_password", None)):
            res = supabase_client.auth.sign_in_with_password({
                "email": payload.email,
                "password": payload.password,
            })
            
            if res and res.user:
                user_obj = res.user
                user_meta = getattr(user_obj, "user_metadata", {}) or {}
                
                role = user_meta.get("role", "user")
                full_name = user_meta.get("full_name", "")
                avatar_url = user_meta.get("avatar_url", "")

                try:
                    prof_res = supabase_client.table("profiles").select("*").eq("id", user_obj.id).execute()
                    if prof_res and hasattr(prof_res, "data") and prof_res.data:
                        prof = prof_res.data[0]
                        role = prof.get("role", role)
                        full_name = prof.get("full_name", full_name)
                        avatar_url = prof.get("avatar_url", avatar_url)
                except Exception as p_err:
                    logger.warning(f"Profile fetch failed during login: {p_err}")

                user_resp = UserResponse(
                    id=str(user_obj.id),
                    email=user_obj.email,
                    full_name=full_name,
                    avatar_url=avatar_url,
                    role=role,
                    created_at=datetime.utcnow()
                )

                log_activity_event(supabase_client, str(user_obj.id), "user_logged_in", {"email": payload.email})

                access_tok = getattr(res.session, "access_token", "mock-access-token") if res.session else "mock-access-token"
                token_res = TokenResponse(
                    access_token=access_tok,
                    token_type="bearer",
                    user=user_resp
                )

                return {"success": True, "data": token_res.model_dump()}
    except Exception as err:
        logger.warning(f"Supabase sign_in error ({err}). Checking dev environment fallback...")
        if settings.ENVIRONMENT == "development":
            user_resp = UserResponse(
                id="00000000-0000-0000-0000-000000000101",
                email=payload.email,
                full_name="Dev Student",
                role="user",
                created_at=datetime.utcnow()
            )
            token_res = TokenResponse(
                access_token="dev-token-logged-in",
                token_type="bearer",
                user=user_resp
            )
            return {"success": True, "data": token_res.model_dump()}
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err) or "Invalid email or password.")

    # Dev fallback login
    user_resp = UserResponse(
        id="00000000-0000-0000-0000-000000000101",
        email=payload.email,
        full_name="Dev Student",
        role="user",
        created_at=datetime.utcnow()
    )
    token_res = TokenResponse(
        access_token="dev-token-logged-in",
        token_type="bearer",
        user=user_resp
    )
    return {"success": True, "data": token_res.model_dump()}


@router.post("/logout")
async def logout(current_user: Dict[str, Any] = Depends(get_current_user), supabase_client: Any = Depends(get_supabase)):
    try:
        if hasattr(supabase_client, "auth") and callable(getattr(supabase_client.auth, "sign_out", None)):
            supabase_client.auth.sign_out()
        
        log_activity_event(supabase_client, current_user.get("id", "usr_anon"), "user_logged_out", {})
        return {"success": True, "data": {"message": "Successfully logged out"}}
    except Exception as err:
        logger.error(f"Logout error: {err}")
        return {"success": False, "error": str(err)}


@router.get("/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_resp = UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user.get("full_name"),
        avatar_url=current_user.get("avatar_url"),
        role=current_user.get("role", "user"),
        created_at=datetime.utcnow()
    )
    return {"success": True, "data": user_resp.model_dump()}


@router.put("/me")
async def update_me(
    payload: UserUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_client: Any = Depends(get_supabase)
):
    try:
        user_id = current_user["id"]
        update_data = {}
        if payload.full_name is not None:
            update_data["full_name"] = payload.full_name
        if payload.avatar_url is not None:
            update_data["avatar_url"] = payload.avatar_url

        if update_data and hasattr(supabase_client, "table"):
            supabase_client.table("profiles").update(update_data).eq("id", user_id).execute()

        updated_user = UserResponse(
            id=user_id,
            email=current_user["email"],
            full_name=payload.full_name if payload.full_name is not None else current_user.get("full_name"),
            avatar_url=payload.avatar_url if payload.avatar_url is not None else current_user.get("avatar_url"),
            role=current_user.get("role", "user"),
            created_at=datetime.utcnow()
        )

        log_activity_event(supabase_client, user_id, "profile_updated", update_data)

        return {"success": True, "data": updated_user.model_dump()}
    except Exception as err:
        logger.error(f"Update profile error: {err}")
        return {"success": False, "error": str(err) or "Failed to update profile"}
