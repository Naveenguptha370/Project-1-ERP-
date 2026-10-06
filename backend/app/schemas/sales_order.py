from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SalesOrderItemBase(BaseModel):
    product_id: Optional[int] = None
    product_name: str
    description: Optional[str] = None
    quantity: float = 1.0
    unit_price: float = 0.0
    discount_percent: float = 0.0
    tax_rate: float = 18.0
    total_amount: float = 0.0


class SalesOrderItemCreate(SalesOrderItemBase):
    pass


class SalesOrderItemOut(SalesOrderItemBase):
    id: int
    sales_order_id: int

    model_config = ConfigDict(from_attributes=True)


class SalesOrderBase(BaseModel):
    quotation_id: Optional[int] = None
    customer_id: Optional[int] = None
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    shipping_address: Optional[str] = None
    billing_address: Optional[str] = None
    order_date: Optional[datetime] = None
    expected_delivery_date: Optional[datetime] = None
    status: Optional[str] = "Draft"
    notes: Optional[str] = None


class SalesOrderCreate(SalesOrderBase):
    items: List[SalesOrderItemCreate] = []


class SalesOrderUpdate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    shipping_address: Optional[str] = None
    billing_address: Optional[str] = None
    expected_delivery_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[SalesOrderItemCreate]] = None


class SalesOrderStatusUpdate(BaseModel):
    status: str


class SalesOrderOut(SalesOrderBase):
    id: int
    order_number: str
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    invoice_id: Optional[int] = None
    created_by_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: List[SalesOrderItemOut] = []

    model_config = ConfigDict(from_attributes=True)
