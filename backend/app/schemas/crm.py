from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    company_name: str | None = Field(default=None, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    country: str = Field(default="India", max_length=100)
    tax_id: str | None = Field(default=None, max_length=50)


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    company_name: str | None = Field(default=None, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    tax_id: str | None = Field(default=None, max_length=50)


class CustomerResponse(CustomerCreate):
    id: int
    created_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class LeadCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    company_name: str | None = Field(default=None, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    source: str | None = Field(default=None, max_length=80)
    status: Literal["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"] = "New"
    estimated_value: Decimal = Field(default=Decimal("0"), ge=0, max_digits=12, decimal_places=2)
    notes: str | None = None
    assigned_to_id: int | None = Field(default=None, gt=0)


class LeadUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    company_name: str | None = Field(default=None, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    source: str | None = Field(default=None, max_length=80)
    status: Literal["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"] | None = None
    estimated_value: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    notes: str | None = None
    assigned_to_id: int | None = Field(default=None, gt=0)


class LeadResponse(LeadCreate):
    id: int
    converted_customer_id: int | None = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CRMActivityResponse(BaseModel):
    id: int
    customer_id: int | None
    lead_id: int | None
    user_id: int | None
    action: str
    details: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CRMActivityCreate(BaseModel):
    customer_id: int | None = Field(default=None, gt=0)
    lead_id: int | None = Field(default=None, gt=0)
    action: Literal["Note", "Call", "Email", "Meeting", "Task"] = "Note"
    details: str = Field(min_length=1, max_length=4000)
