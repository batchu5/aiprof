import logging
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import Request, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from app.database import get_supabase

logger = logging.getLogger("uvicorn.error")
security = HTTPBearer(auto_error=False)


def ensure_user_profile(
    supabase_client: Any,
    user_id: str,
    email: Optional[str] = None,
    full_name: Optional[str] = None,
    role: str = "user",
    avatar_url: str = "",
) -> bool:
    """Ensures a record exists in the profiles table for user_id to satisfy foreign key constraints."""
    if not hasattr(supabase_client, "table"):
        return False
    try:
        profile_res = supabase_client.table("profiles").select("id").eq("id", user_id).execute()
        if profile_res and hasattr(profile_res, "data") and profile_res.data:
            return True

        supabase_client.table("profiles").upsert({
            "id": user_id,
            "email": email or f"student_{user_id[:8]}@university.edu",
            "full_name": full_name or "Student User",
            "avatar_url": avatar_url,
            "role": role,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }, on_conflict="id").execute()
        return True
    except Exception as err:
        logger.warning(f"Could not ensure profile record for {user_id}: {err}")
        return False


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    supabase_client: Any = Depends(get_supabase),
) -> Dict[str, Any]:
    token: Optional[str] = None

    # 1. Extract Bearer token from Authorization header or request
    if credentials:
        token = credentials.credentials
    elif "authorization" in request.headers:
        auth_header = request.headers["authorization"]
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Verify token via Supabase Auth
    try:
        if hasattr(supabase_client, "auth") and callable(getattr(supabase_client.auth, "get_user", None)):
            from supabase import create_client
            auth_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            res = auth_client.auth.get_user(token)
            if res and res.user:
                user_obj = res.user
                user_id = str(user_obj.id)
                user_meta = getattr(user_obj, "user_metadata", {}) or {}
                
                profile_role = user_meta.get("role", "user")
                full_name = user_meta.get("full_name") or (user_obj.email.split("@")[0].title() if user_obj.email else "Student")
                avatar_url = user_meta.get("avatar_url", "")

                # Sync profile in database
                ensure_user_profile(
                    supabase_client,
                    user_id=user_id,
                    email=user_obj.email,
                    full_name=full_name,
                    role=profile_role,
                    avatar_url=avatar_url,
                )

                return {
                    "id": user_id,
                    "email": user_obj.email,
                    "role": profile_role,
                    "full_name": full_name,
                    "avatar_url": avatar_url,
                }
    except Exception as err:
        logger.warning(f"Supabase auth check failed or running in dev fallback mode: {err}")

# 3. Development fallback verification (uses valid UUID format)
    if token.startswith("dev-token-"):
        logger.warning("[Auth] Using development fallback — not for production use.")
        dev_id = "00000000-0000-0000-0000-000000000101"
        ensure_user_profile(
            supabase_client,
            user_id=dev_id,
            email="dev-user@localhost",
            full_name="Dev Student",
            role="user",
        )

        return {
            "id": dev_id,
            "email": "dev-user@localhost",
            "role": "user",
            "full_name": "Dev Student",
            "avatar_url": "",
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def require_admin(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    role = current_user.get("role", "user")
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to perform this action",
        )
    return current_user


# Alias for backward compatibility
get_admin_user = require_admin


async def verify_project_access(
    project_id: str,
    user_id: str,
    supabase_client: Any,
    current_user: Dict[str, Any],
) -> None:
    """
    Shared helper to verify that a user owns the project or is admin.
    Raises HTTPException 403 if access is denied.
    """
    try:
        if hasattr(supabase_client, "table"):
            res = supabase_client.table("projects").select("user_id").eq("id", project_id).execute()
            if res and hasattr(res, "data") and res.data:
                proj_user = str(res.data[0].get("user_id"))
                if proj_user != user_id and current_user.get("role") != "admin":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access denied to this project",
                    )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Error checking project ownership: {e}")
