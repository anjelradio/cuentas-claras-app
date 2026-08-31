from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ActivityRead(BaseModel):
    id: str
    type: str
    actorName: str
    targetName: Optional[str] = None
    createdAt: datetime
    description: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class ActivityPaginatedRead(BaseModel):
    items: List[ActivityRead]
    total: int
    has_more: bool
