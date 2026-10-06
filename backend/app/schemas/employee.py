"""SmartERP - Employee Schemas"""
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import date, datetime
from app.models.employee import EmployeeStatus, Gender
from app.schemas.department import DepartmentSummary


class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    job_title: str
    department_id: Optional[int] = None
    hire_date: date
    salary: Optional[float] = None
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    @field_validator("first_name", "last_name", "job_title")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be empty")
        return v

    @field_validator("salary")
    @classmethod
    def salary_positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Salary cannot be negative")
        return v


class EmployeeCreate(EmployeeBase):
    employee_id: Optional[str] = None  # auto-generated if not provided


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    job_title: Optional[str] = None
    department_id: Optional[int] = None
    hire_date: Optional[date] = None
    salary: Optional[float] = None
    status: Optional[EmployeeStatus] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


class EmployeeOut(EmployeeBase):
    id: int
    employee_id: str
    full_name: str
    department: Optional[DepartmentSummary] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class EmployeeSummary(BaseModel):
    """Lightweight employee info used inside Attendance/Leave responses"""
    id: int
    employee_id: str
    full_name: str
    job_title: str
    department: Optional[DepartmentSummary] = None

    model_config = {"from_attributes": True}
