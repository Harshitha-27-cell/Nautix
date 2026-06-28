from datetime import datetime
from pydantic import BaseModel, ConfigDict


class QueryLogBase(BaseModel):
    query: str
    execution_time: float
    status: str


class QueryLogCreate(QueryLogBase):
    user_id: int


class QueryLogOut(QueryLogBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
