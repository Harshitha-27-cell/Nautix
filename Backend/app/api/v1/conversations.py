from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.crud import conversation as crud_conversation
from app.crud import message as crud_message
from app.models.user import User
from app.schemas.conversation import (
    ConversationCreate,
    ConversationOut,
    ConversationWithMessages,
)
from app.schemas.message import MessageCreate, MessageOut

router = APIRouter()


@router.get("/", response_model=List[ConversationOut])
async def read_conversations(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    conversations = await crud_conversation.get_conversations_by_user(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return conversations


@router.post("/", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation_in: ConversationCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    conversation = await crud_conversation.create_conversation(
        db, obj_in=conversation_in, user_id=current_user.id
    )
    return conversation


@router.get("/{conversation_id}", response_model=ConversationWithMessages)
async def read_conversation(
    conversation_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    conversation = await crud_conversation.get_conversation_by_id(
        db, conversation_id=conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )
    if conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this conversation",
        )
    return conversation


@router.post(
    "/{conversation_id}/messages",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_message(
    conversation_id: int,
    message_in: MessageCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    conversation = await crud_conversation.get_conversation_by_id(
        db, conversation_id=conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )
    if conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to post messages in this conversation",
        )
    message = await crud_message.create_message(
        db, obj_in=message_in, conversation_id=conversation_id
    )
    return message


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    conversation = await crud_conversation.get_conversation_by_id(
        db, conversation_id=conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )
    if conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this conversation",
        )
    await crud_conversation.delete_conversation(db, conversation_id=conversation_id)
    return
