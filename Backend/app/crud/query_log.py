from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.query_log import QueryLog
from app.schemas.query_log import QueryLogCreate


async def get_query_logs_by_user(
    db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100
) -> List[QueryLog]:
    result = await db.execute(
        select(QueryLog)
        .where(QueryLog.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .order_by(QueryLog.created_at.desc())
    )
    return list(result.scalars().all())


async def create_query_log(
    db: AsyncSession,
    user_id: int,
    query: str,
    execution_time: float,
    status: str,
) -> QueryLog:
    db_log = QueryLog(
        user_id=user_id,
        query=query,
        execution_time=execution_time,
        status=status,
    )
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    return db_log
