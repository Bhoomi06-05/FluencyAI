from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

ModeType = Literal[
    "friendly", "teacher", "practice", "interview", "roleplay", "free_chat"
]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    # None = nayi conversation shuru karo, warna purani me message jodo
    conversation_id: int | None = None
    mode: ModeType = "friendly"


class ChatResponse(BaseModel):
    conversation_id: int
    reply: str


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: int
    mode: str
    started_at: datetime

    model_config = {"from_attributes": True}