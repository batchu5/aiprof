from datetime import datetime
from pydantic import BaseModel


class MasteryResponse(BaseModel):
    id: str
    topic: str
    space_id: str
    mastery_score: float
    last_evaluated: datetime
