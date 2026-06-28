from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.crud import query_log as crud_query_log
from app.models.user import User
from app.schemas.query_log import QueryLogOut

router = APIRouter()


@router.get("/", response_model=List[QueryLogOut])
async def read_query_logs(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    query_logs = await crud_query_log.get_query_logs_by_user(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return query_logs


@router.post("/", response_model=QueryLogOut, status_code=status.HTTP_201_CREATED)
async def create_query_log(
    query: str,
    execution_time: float,
    status: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    log = await crud_query_log.create_query_log(
        db,
        user_id=current_user.id,
        query=query,
        execution_time=execution_time,
        status=status,
    )
    return log
