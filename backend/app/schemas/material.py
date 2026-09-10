from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class MaterialResponse(BaseModel):
    id: str
    project_id: str
    filename: str
    file_type: str
    is_vectorized: bool
    created_at: datetime
