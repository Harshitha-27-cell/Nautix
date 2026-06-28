from typing import Dict, Optional
from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    content: str = Field(..., description="The message text submitted by the user")
    conversation_id: Optional[int] = Field(
        None,
        description="The active conversation session ID. If omitted, a new conversation is initialized.",
    )


class ChatMessageResponse(BaseModel):
    conversation_id: int = Field(..., description="The conversation session identifier")
    reply: str = Field(..., description="The natural language answer text from the chatbot")
    extracted_entities: Dict = Field(
        default={},
        description="Extracted parameters (e.g. float_id, parameters, regions) for UI updates",
    )
