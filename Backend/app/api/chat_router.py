from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from app.schemas.message import MessageOut
from app.services.chat import ChatService
from app.crud.conversation import get_conversation_by_id
from app.crud.message import get_messages_by_conversation

router = APIRouter()


@router.post(
    "/message", response_model=ChatMessageResponse, status_code=status.HTTP_200_OK
)
async def send_chat_message(
    chat_in: ChatMessageRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    chat_service: ChatService = Depends(deps.get_chat_service),
):
    """Submit a message to the AI Oceanographic assistant.

    Automatically handles intent detection, entities extraction, memory, and context mapping.
    """
    try:
        response = await chat_service.process_chat_message(
            db,
            user_id=current_user.id,
            content=chat_in.content,
            conversation_id=chat_in.conversation_id,
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the chat: {str(e)}",
        )


@router.get(
    "/history/{conversation_id}",
    response_model=List[MessageOut],
    status_code=status.HTTP_200_OK,
)
async def read_chat_history(
    conversation_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Retrieve full messaging history logs for a specific conversation session."""
    conversation = await get_conversation_by_id(db, conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )
    if conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view history for this conversation.",
        )

    messages = await get_messages_by_conversation(db, conversation_id)
    return messages
