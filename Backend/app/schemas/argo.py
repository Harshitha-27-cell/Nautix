from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ArgoMeasurement(BaseModel):
    pressure: float = Field(..., description="Water pressure in decibars (dbar)")
    temperature: float = Field(..., description="Water temperature in Celsius (°C)")
    salinity: float = Field(..., description="Water salinity in Practical Salinity Units (PSU)")


class ArgoProfile(BaseModel):
    profile_id: str = Field(..., description="Unique identifier for this specific profile cycle")
    platform_number: str = Field(..., description="Float platform number (WMO code)")
    latitude: float = Field(..., description="Latitude coordinate at recording time")
    longitude: float = Field(..., description="Longitude coordinate at recording time")
    timestamp: datetime = Field(..., description="Date and time of the profile measurement cycle")
    measurements: List[ArgoMeasurement] = Field(
        default=[], description="List of physical parameters measured along depth profile"
    )


class ArgoFloatMetadata(BaseModel):
    float_id: int = Field(..., description="Primary database reference identifier")
    platform_number: str = Field(..., description="Unique platform number (WMO code)")
    latitude: float = Field(..., description="Current/last recorded latitude coordinate")
    longitude: float = Field(..., description="Current/last recorded longitude coordinate")
    region: str = Field(..., description="Geographic region index")
    deployment_date: date = Field(..., description="Launch date of the float")
    last_active: Optional[datetime] = Field(None, description="Timestamp of the last active profile")


class ArgoSearchResult(BaseModel):
    query_parameters: dict = Field(..., description="Echo of request search filters")
    results_count: int = Field(..., description="Count of found records")
    floats: List[ArgoFloatMetadata] = Field(default=[], description="Matching Argo floats list")
    profiles: List[ArgoProfile] = Field(
        default=[], description="Matching profiles data matching search parameters"
    )
