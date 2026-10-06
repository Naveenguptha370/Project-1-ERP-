from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PaymentBase(BaseModel):
    invoice_id: int
    customer_id: Optional[int] = None
    customer_name: str
    payment_date: Optional[datetime] = None
    payment_method: Optional[str] = "Bank Transfer"
    reference_number: Optional[str] = None
    amount: float
    notes: Optional[str] = None
    status: Optional[str] = "Completed"


class PaymentCreate(PaymentBase):
    pass


class PaymentOut(PaymentBase):
    id: int
    payment_number: str
    created_by_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
