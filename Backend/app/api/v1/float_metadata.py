from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.crud import float_metadata as crud_float
from app.models.user import User
from app.schemas.float_metadata import (
    FloatMetadataCreate,
    FloatMetadataOut,
    FloatMetadataUpdate,
)

router = APIRouter()


@router.get("/search", response_model=List[FloatMetadataOut])
async def search_floats(
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
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    floats = await crud_float.search_floats(
        db,
        platform_number=platform_number,
        region=region,
        min_lat=min_lat,
        max_lat=max_lat,
        min_lon=min_lon,
        max_lon=max_lon,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )
    return floats


@router.get("/{float_id}", response_model=FloatMetadataOut)
async def read_float(
    float_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    db_float = await crud_float.get_float_by_id(db, float_id=float_id)
    if not db_float:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Float metadata not found"
        )
    return db_float


@router.post("/", response_model=FloatMetadataOut, status_code=status.HTTP_201_CREATED)
async def create_float(
    float_in: FloatMetadataCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    db_float = await crud_float.get_float_by_platform_number(
        db, platform_number=float_in.platform_number
    )
    if db_float:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Float with platform number {float_in.platform_number} already exists.",
        )
    new_float = await crud_float.create_float_metadata(db, obj_in=float_in)
    return new_float


@router.put("/{float_id}", response_model=FloatMetadataOut)
async def update_float(
    float_id: int,
    float_in: FloatMetadataUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    db_float = await crud_float.get_float_by_id(db, float_id=float_id)
    if not db_float:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Float metadata not found"
        )
    updated_float = await crud_float.update_float_metadata(
        db, db_float=db_float, obj_in=float_in
    )
    return updated_float


@router.delete("/{float_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_float(
    float_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    deleted = await crud_float.delete_float_metadata(db, float_id=float_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Float metadata not found"
        )
    return
