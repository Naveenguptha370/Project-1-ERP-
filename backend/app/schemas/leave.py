"""SmartERP - Leave Schemas"""
from pydantic import BaseModel, model_validator, field_validator
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from app.models.leave import LeaveType, LeaveStatus
from app.schemas.employee import EmployeeSummary


class LeaveBase(BaseModel):
    employee_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: str

    @model_validator(mode="after")
    def end_not_before_start(self) -> "LeaveBase":
        if self.end_date < self.start_date:
            raise ValueError("End date cannot be before start date")
        return self

    @field_validator("reason")
    @classmethod
    def reason_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Reason cannot be empty")
        return v


class LeaveCreate(LeaveBase):
    pass


class LeaveUpdate(BaseModel):
    leave_type: Optional[LeaveType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reason: Optional[str] = None

    @model_validator(mode="after")
    def end_not_before_start(self) -> "LeaveUpdate":
        if self.start_date and self.end_date:
            if self.end_date < self.start_date:
                raise ValueError("End date cannot be before start date")
        return self


class LeaveReview(BaseModel):
    """Used by managers/admins to approve or reject a leave."""
    status: LeaveStatus
    remarks: Optional[str] = None

    @field_validator("status")
    @classmethod
    def only_terminal_statuses(cls, v: LeaveStatus) -> LeaveStatus:
        if v not in (LeaveStatus.APPROVED, LeaveStatus.REJECTED):
            raise ValueError("Review action must be APPROVED or REJECTED")
        return v


class LeaveOut(LeaveBase):
    id: int
    total_days: float
    status: LeaveStatus
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    remarks: Optional[str] = None
    employee: Optional[EmployeeSummary] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
