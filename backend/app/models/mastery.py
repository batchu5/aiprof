from datetime import datetime
from pydantic import BaseModel, Field


class MasteryModel(BaseModel):
    id: str
    user_id: str
    topic: str
    space_id: str
    mastery_score: float = 0.0  # 0.0 to 100.0
    last_evaluated: datetime = Field(default_factory=datetime.utcnow)
