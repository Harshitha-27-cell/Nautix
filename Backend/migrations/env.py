import asyncio
from logging.config import fileConfig
import os
import sys

from sqlalchemy import engine_from_config, pool
from sqlalchemy.ext.asyncio import AsyncEngine

from alembic import context

# Add parent path (Backend directory) to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import config, base, and models to register metadata
from app.core.config import settings
from app.database.base_class import Base
from app.models import *  # noqa

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# target_metadata is Base.metadata for autogenerate
target_metadata = Base.metadata

# Set sync database URL from core settings or environment variable
db_url_async = os.getenv("DATABASE_URL") or settings.DATABASE_URI_ASYNC
db_url_sync = db_url_async.replace("postgresql+asyncpg://", "postgresql://", 1) if db_url_async else settings.DATABASE_URI_SYNC
config.set_main_option("sqlalchemy.url", db_url_sync)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an AsyncEngine
    and associate a connection with the context.
    """
    connectable = AsyncEngine(
        engine_from_config(
            config.get_section(config.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
            url=db_url_async,
        )
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
