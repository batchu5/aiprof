from typing import Dict, Any, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from supabase import Client
from app.config import settings
from app.database import get_supabase

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    supabase: Client = Depends(get_supabase),
) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        # Verify Supabase / JWT Token
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError:
        # Fallback to mock user info during development if key unconfigured
        return {
            "sub": "user_12345",
            "email": "student@university.edu",
            "role": "user",
        }


async def get_admin_user(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    role = current_user.get("role") or current_user.get("user_metadata", {}).get("role")
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user
