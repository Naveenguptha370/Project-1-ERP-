from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SupplierCreate(BaseModel):
    supplier_code: str = Field(min_length=2, max_length=50)
    company_name: str = Field(min_length=2, max_length=150)
    contact_name: str | None = Field(default=None, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    address: str | None = None
    tax_id: str | None = Field(default=None, max_length=60)


class SupplierUpdate(BaseModel):
    company_name: str | None = Field(default=None, min_length=2, max_length=150)
    contact_name: str | None = Field(default=None, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    address: str | None = None
    tax_id: str | None = Field(default=None, max_length=60)
    is_active: bool | None = None


class SupplierResponse(SupplierCreate):
    id: int
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PurchaseOrderItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=1_000_000)
    unit_cost: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    tax_rate: Decimal = Field(default=Decimal("0"), ge=0, le=100, max_digits=5, decimal_places=2)


class PurchaseOrderCreate(BaseModel):
    supplier_id: int = Field(gt=0)
    warehouse_id: int = Field(gt=0)
    expected_date: datetime | None = None
    notes: str | None = None
    items: list[PurchaseOrderItemCreate] = Field(min_length=1, max_length=100)


class PurchaseOrderStatusUpdate(BaseModel):
    status: Literal["Ordered", "Received", "Cancelled"]


class PurchaseOrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_cost: Decimal
    tax_rate: Decimal
    line_total: Decimal
    model_config = ConfigDict(from_attributes=True)


class PurchaseOrderResponse(BaseModel):
    id: int
    order_number: str
    supplier_id: int
    warehouse_id: int
    status: str
    order_date: datetime
    expected_date: datetime | None
    received_at: datetime | None
    subtotal: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    notes: str | None
    items: list[PurchaseOrderItemResponse]
    model_config = ConfigDict(from_attributes=True)
