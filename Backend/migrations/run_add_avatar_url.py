import asyncio
from sqlalchemy import text
from app.database.session import engine


async def migrate():
    async with engine.begin() as conn:
        await conn.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512)")
        )
        await conn.execute(
            text(
                "UPDATE users SET avatar_url = 'https://cdn-icons-png.flaticon.com/512/616/616408.png' "
                "WHERE avatar_url IS NULL"
            )
        )
    print("Migration applied successfully")


if __name__ == "__main__":
    asyncio.run(migrate())
