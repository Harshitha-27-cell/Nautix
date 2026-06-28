import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

# Prefer DATABASE_URL from environment variables directly, falling back to settings
database_url = os.getenv("DATABASE_URL") or settings.DATABASE_URI_ASYNC

engine = create_async_engine(
    database_url,
    pool_pre_ping=True,
    echo=False
)

async_session = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)
