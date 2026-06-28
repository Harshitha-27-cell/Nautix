from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


# Shared properties
class UserBase(BaseModel):
    name: str
    email: EmailStr


# Properties to receive on user creation
class UserCreate(UserBase):
    password: str
    avatar_url: Optional[str] = None


# Properties to receive on user update
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    avatar_url: Optional[str] = None


# Properties to return to client
class UserOut(UserBase):
    id: int
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
