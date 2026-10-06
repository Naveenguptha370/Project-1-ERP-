from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class InvoiceItemBase(BaseModel):
    product_id: Optional[int] = None
    product_name: str
    description: Optional[str] = None
    quantity: float = 1.0
    unit_price: float = 0.0
    discount_percent: float = 0.0
    tax_rate: float = 18.0
    total_amount: float = 0.0


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItemOut(InvoiceItemBase):
    id: int
    invoice_id: int

    model_config = ConfigDict(from_attributes=True)


class InvoiceBase(BaseModel):
    sales_order_id: Optional[int] = None
    customer_id: Optional[int] = None
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    issue_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = "Unpaid"
    notes: Optional[str] = None
    payment_terms: Optional[str] = "Due in 30 days"


class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate] = []


class InvoiceUpdate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    payment_terms: Optional[str] = None
    items: Optional[List[InvoiceItemCreate]] = None


class InvoiceStatusUpdate(BaseModel):
    status: str


class InvoiceOut(InvoiceBase):
    id: int
    invoice_number: str
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    amount_paid: float
    balance_due: float
    created_by_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: List[InvoiceItemOut] = []

    model_config = ConfigDict(from_attributes=True)
