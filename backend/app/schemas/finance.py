from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ExpenseCreate(BaseModel):
    category: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=2, max_length=255)
    vendor: str | None = Field(default=None, max_length=150)
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    expense_date: datetime | None = None
    payment_method: str | None = Field(default=None, max_length=50)
    reference_number: str | None = Field(default=None, max_length=100)
    notes: str | None = None


class ExpenseReview(BaseModel):
    status: Literal["Approved", "Rejected"]
    review_note: str | None = None


class ExpenseResponse(BaseModel):
    id: int
    expense_number: str
    category: str
    description: str
    vendor: str | None
    amount: Decimal
    expense_date: datetime
    status: str
    payment_method: str | None
    reference_number: str | None
    notes: str | None
    review_note: str | None
    created_by_id: int | None
    reviewed_by_id: int | None
    created_at: datetime
    reviewed_at: datetime | None
    model_config = ConfigDict(from_attributes=True)
