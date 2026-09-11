import logging
from typing import Dict, Any, Optional
from fastapi import Request, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from app.config import settings
from app.database import get_supabase

logger = logging.getLogger("uvicorn.error")
security = HTTPBearer(auto_error=False)


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
            res = supabase_client.auth.get_user(token)
            if res and res.user:
                user_obj = res.user
                user_meta = getattr(user_obj, "user_metadata", {}) or {}
                
                # Query profiles table if available
                profile_role = user_meta.get("role", "user")
                full_name = user_meta.get("full_name", "")
                avatar_url = user_meta.get("avatar_url", "")

                try:
                    profile_res = supabase_client.table("profiles").select("*").eq("id", user_obj.id).execute()
                    if profile_res and hasattr(profile_res, "data") and profile_res.data:
                        prof = profile_res.data[0]
                        profile_role = prof.get("role", profile_role)
                        full_name = prof.get("full_name", full_name)
                        avatar_url = prof.get("avatar_url", avatar_url)
                except Exception as profile_err:
                    logger.warning(f"Could not fetch profile details: {profile_err}")

                return {
                    "id": str(user_obj.id),
                    "email": user_obj.email,
                    "role": profile_role,
                    "full_name": full_name,
                    "avatar_url": avatar_url,
                }
    except Exception as err:
        logger.warning(f"Supabase auth check failed or running in dev fallback mode: {err}")

    # Development fallback verification if secret token or dev JWT provided
    if token.startswith("dev-token-") or settings.ENVIRONMENT == "development":
        return {
            "id": "usr_dev_12345",
            "email": "student@university.edu",
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
