from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class CustomerBase(BaseModel):
    name: str
    company_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "India"
    tax_id: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(CustomerBase):
    name: Optional[str] = None


class CustomerOut(CustomerBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
