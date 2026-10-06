from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class QuotationItemBase(BaseModel):
    product_id: Optional[int] = None
    product_name: str
    description: Optional[str] = None
    quantity: float = 1.0
    unit_price: float = 0.0
    discount_percent: float = 0.0
    tax_rate: float = 18.0
    total_amount: float = 0.0


class QuotationItemCreate(QuotationItemBase):
    pass


class QuotationItemOut(QuotationItemBase):
    id: int
    quotation_id: int

    model_config = ConfigDict(from_attributes=True)


class QuotationBase(BaseModel):
    customer_id: Optional[int] = None
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    issue_date: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    status: Optional[str] = "Draft"
    notes: Optional[str] = None
    terms: Optional[str] = None


class QuotationCreate(QuotationBase):
    items: List[QuotationItemCreate] = []


class QuotationUpdate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    valid_until: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    items: Optional[List[QuotationItemCreate]] = None


class QuotationStatusUpdate(BaseModel):
    status: str


class QuotationOut(QuotationBase):
    id: int
    quote_number: str
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    sales_order_id: Optional[int] = None
    created_by_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: List[QuotationItemOut] = []

    model_config = ConfigDict(from_attributes=True)
