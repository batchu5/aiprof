from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class MessagePayload(BaseModel):
    project_id: str
    message: str


class MessageResponse(BaseModel):
    id: str
    sender: str  # 'user' or 'ai'
    text: str
    timestamp: datetime
