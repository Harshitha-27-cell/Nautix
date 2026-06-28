from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api import deps
from app.models.user import User
from app.schemas.argo import ArgoFloatMetadata, ArgoProfile
from app.services.argo import ArgoService

router = APIRouter()


@router.get("/floats", response_model=List[ArgoFloatMetadata])
async def read_argo_floats(
    service: ArgoService = Depends(deps.get_argo_service),
    current_user: User = Depends(deps.get_current_user),
):
    """Retrieve metadata list of all active Argo floats."""
    return await service.get_all_floats()


@router.get("/float/{platform_number}", response_model=ArgoFloatMetadata)
async def read_argo_float_by_id(
    platform_number: str,
    service: ArgoService = Depends(deps.get_argo_service),
    current_user: User = Depends(deps.get_current_user),
):
    """Retrieve metadata details for a specific float using its platform number (WMO code)."""
    fl = await service.get_float_by_platform_number(platform_number)
    if not fl:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Argo float with platform number {platform_number} not found.",
        )
    return fl


@router.get("/profile/{platform_number}", response_model=List[ArgoProfile])
async def read_argo_float_profiles(
    platform_number: str,
    service: ArgoService = Depends(deps.get_argo_service),
    current_user: User = Depends(deps.get_current_user),
):
    """Retrieve temperature, salinity, and pressure depth profiles for a specific float."""
    profiles = await service.get_float_profiles(platform_number)
    if not profiles:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No profiles found for float platform number {platform_number}.",
        )
    return profiles


@router.get("/search", response_model=List[ArgoProfile])
async def search_argo_data(
    platform_number: Optional[str] = Query(
        None, description="Filter by WMO platform number"
    ),
    region: Optional[str] = Query(None, description="Filter by geographic ocean region"),
    min_lat: Optional[float] = Query(None, description="Minimum latitude bounding box"),
    max_lat: Optional[float] = Query(None, description="Maximum latitude bounding box"),
    min_lon: Optional[float] = Query(None, description="Minimum longitude bounding box"),
    max_lon: Optional[float] = Query(None, description="Maximum longitude bounding box"),
    start_date: Optional[date] = Query(None, description="Minimum deployment or profile date"),
    end_date: Optional[date] = Query(None, description="Maximum deployment or profile date"),
    min_temp: Optional[float] = Query(
        None, description="Filter depth samples by minimum temperature threshold"
    ),
    max_temp: Optional[float] = Query(
        None, description="Filter depth samples by maximum temperature threshold"
    ),
    service: ArgoService = Depends(deps.get_argo_service),
    current_user: User = Depends(deps.get_current_user),
):
    """Advanced lookup query interface searching by float id, dates, spatial boxes, or parameter values."""
    return await service.search_argo_data(
        platform_number=platform_number,
        region=region,
        min_lat=min_lat,
        max_lat=max_lat,
        min_lon=min_lon,
        max_lon=max_lon,
        start_date=start_date,
        end_date=end_date,
        min_temp=min_temp,
        max_temp=max_temp,
    )
