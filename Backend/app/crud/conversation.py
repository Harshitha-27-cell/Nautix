from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.conversation import Conversation
from app.schemas.conversation import ConversationCreate, ConversationUpdate


async def get_conversations_by_user(
    db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100
) -> List[Conversation]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .order_by(Conversation.created_at.desc())
    )
    return list(result.scalars().all())


async def get_conversation_by_id(
    db: AsyncSession, conversation_id: int
) -> Optional[Conversation]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .options(selectinload(Conversation.messages))
    )
    return result.scalars().first()


async def create_conversation(
    db: AsyncSession, obj_in: ConversationCreate, user_id: int
) -> Conversation:
    db_conversation = Conversation(title=obj_in.title, user_id=user_id)
    db.add(db_conversation)
    await db.commit()
    await db.refresh(db_conversation)
    return db_conversation


async def update_conversation(
    db: AsyncSession, db_conversation: Conversation, obj_in: ConversationUpdate
) -> Conversation:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_conversation, field, value)
    db.add(db_conversation)
    await db.commit()
    await db.refresh(db_conversation)
    return db_conversation


async def delete_conversation(db: AsyncSession, conversation_id: int) -> bool:
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    db_conversation = result.scalars().first()
    if db_conversation:
        await db.delete(db_conversation)
        await db.commit()
        return True
    return False
