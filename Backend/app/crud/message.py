from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.message import Message
from app.schemas.message import MessageCreate


async def get_messages_by_conversation(
    db: AsyncSession, conversation_id: int
) -> List[Message]:
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.timestamp.asc())
    )
    return list(result.scalars().all())


async def create_message(
    db: AsyncSession, obj_in: MessageCreate, conversation_id: int
) -> Message:
    db_message = Message(
        conversation_id=conversation_id,
        sender=obj_in.sender,
        content=obj_in.content,
    )
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    return db_message
