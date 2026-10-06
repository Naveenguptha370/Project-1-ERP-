"""SmartERP - Attendance Schemas"""
from pydantic import BaseModel, model_validator, field_validator
from typing import Optional
from datetime import date, time, datetime
from app.models.attendance import AttendanceStatus
from app.schemas.employee import EmployeeSummary


class AttendanceBase(BaseModel):
    employee_id: int
    date: date
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    status: AttendanceStatus = AttendanceStatus.PRESENT
    remarks: Optional[str] = None

    @model_validator(mode="after")
    def check_out_after_check_in(self) -> "AttendanceBase":
        if self.check_in and self.check_out:
            if self.check_out <= self.check_in:
                raise ValueError("Check-out time must be after check-in time")
        return self


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    status: Optional[AttendanceStatus] = None
    remarks: Optional[str] = None

    @model_validator(mode="after")
    def check_out_after_check_in(self) -> "AttendanceUpdate":
        if self.check_in and self.check_out:
            if self.check_out <= self.check_in:
                raise ValueError("Check-out time must be after check-in time")
        return self


class AttendanceOut(AttendanceBase):
    id: int
    employee: Optional[EmployeeSummary] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
