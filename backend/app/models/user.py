from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserModel(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "user"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
