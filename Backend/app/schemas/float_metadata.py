from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class FloatMetadataBase(BaseModel):
    platform_number: str
    latitude: float
    longitude: float
    region: str
    deployment_date: date


class FloatMetadataCreate(FloatMetadataBase):
    pass


class FloatMetadataUpdate(BaseModel):
    platform_number: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    region: Optional[str] = None
    deployment_date: Optional[date] = None


class FloatMetadataOut(FloatMetadataBase):
    float_id: int

    model_config = ConfigDict(from_attributes=True)
