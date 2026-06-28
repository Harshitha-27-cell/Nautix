from datetime import datetime
from pydantic import BaseModel, ConfigDict


class MessageBase(BaseModel):
    content: str


class MessageCreate(MessageBase):
    sender: str  # 'user' or 'bot'


class MessageOut(MessageBase):
    id: int
    conversation_id: int
    sender: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
