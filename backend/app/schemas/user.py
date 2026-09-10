from typing import Optional
from pydantic import BaseModel, EmailStr


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "user"
