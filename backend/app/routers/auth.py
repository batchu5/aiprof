from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import UserRegisterRequest, UserLoginRequest, UserResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse)
async def register(payload: UserRegisterRequest):
    return UserResponse(
        id="usr_registered_1",
        email=payload.email,
        full_name=payload.full_name,
        role="user"
    )


@router.post("/login")
async def login(payload: UserLoginRequest):
    return {
        "access_token": "mock-jwt-access-token",
        "token_type": "bearer",
        "user": {
            "id": "usr_1",
            "email": payload.email,
            "role": "user"
        }
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return UserResponse(
        id=current_user.get("sub", "usr_1"),
        email=current_user.get("email", "student@university.edu"),
        role=current_user.get("role", "user")
    )
