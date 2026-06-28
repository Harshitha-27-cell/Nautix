from datetime import date
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.float_metadata import FloatMetadata
from app.schemas.float_metadata import FloatMetadataCreate, FloatMetadataUpdate


async def get_float_by_id(db: AsyncSession, float_id: int) -> Optional[FloatMetadata]:
    result = await db.execute(
        select(FloatMetadata).where(FloatMetadata.float_id == float_id)
    )
    return result.scalars().first()


async def get_float_by_platform_number(
    db: AsyncSession, platform_number: str
) -> Optional[FloatMetadata]:
    result = await db.execute(
        select(FloatMetadata).where(FloatMetadata.platform_number == platform_number)
    )
    return result.scalars().first()


async def search_floats(
    db: AsyncSession,
    platform_number: Optional[str] = None,
    region: Optional[str] = None,
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lon: Optional[float] = None,
    max_lon: Optional[float] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[FloatMetadata]:
    query = select(FloatMetadata)
    if platform_number:
        query = query.where(FloatMetadata.platform_number == platform_number)
    if region:
        query = query.where(FloatMetadata.region.ilike(f"%{region}%"))
    if min_lat is not None:
        query = query.where(FloatMetadata.latitude >= min_lat)
    if max_lat is not None:
        query = query.where(FloatMetadata.latitude <= max_lat)
    if min_lon is not None:
        query = query.where(FloatMetadata.longitude >= min_lon)
    if max_lon is not None:
        query = query.where(FloatMetadata.longitude <= max_lon)
    if start_date:
        query = query.where(FloatMetadata.deployment_date >= start_date)
    if end_date:
        query = query.where(FloatMetadata.deployment_date <= end_date)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_float_metadata(
    db: AsyncSession, obj_in: FloatMetadataCreate
) -> FloatMetadata:
    db_float = FloatMetadata(
        platform_number=obj_in.platform_number,
        latitude=obj_in.latitude,
        longitude=obj_in.longitude,
        region=obj_in.region,
        deployment_date=obj_in.deployment_date,
    )
    db.add(db_float)
    await db.commit()
    await db.refresh(db_float)
    return db_float


async def update_float_metadata(
    db: AsyncSession, db_float: FloatMetadata, obj_in: FloatMetadataUpdate
) -> FloatMetadata:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_float, field, value)
    db.add(db_float)
    await db.commit()
    await db.refresh(db_float)
    return db_float


async def delete_float_metadata(db: AsyncSession, float_id: int) -> bool:
    db_float = await get_float_by_id(db, float_id)
    if db_float:
        await db.delete(db_float)
        await db.commit()
        return True
    return False
