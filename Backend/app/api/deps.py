from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.database.session import async_session
from app.crud.user import get_user_by_id
from app.models.user import User
from app.schemas.auth import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        token_payload = TokenPayload(sub=user_id_str)
    except JWTError:
        raise credentials_exception

    try:
        user_id = int(token_payload.sub)
    except ValueError:
        raise credentials_exception

    user = await get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


from app.services.argo import ArgoAPIClient, ArgoCacheManager, ArgoService
from app.services.chat import ChatService

# Singletons initialized once
_argo_client = ArgoAPIClient()
_argo_cache = ArgoCacheManager()


def get_argo_service() -> ArgoService:
    return ArgoService(client=_argo_client, cache=_argo_cache)


def get_chat_service(
    argo: ArgoService = Depends(get_argo_service),
) -> ChatService:
    return ChatService(argo_service=argo)


from app.services.rag import EmbeddingGenerator, LocalVectorDB, RAGService

# Singletons for RAG indexing
_embedder = EmbeddingGenerator()
_vector_db = LocalVectorDB()


def get_rag_service() -> RAGService:
    return RAGService(embedder=_embedder, vector_db=_vector_db)


from app.services.visualization import VisualizationService


def get_visualization_service(
    argo: ArgoService = Depends(get_argo_service),
) -> VisualizationService:
    return VisualizationService(argo_service=argo)
