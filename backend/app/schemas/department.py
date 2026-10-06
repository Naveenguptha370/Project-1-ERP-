"""SmartERP - Department Schemas"""
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class DepartmentBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Department name cannot be empty")
        if len(v) > 100:
            raise ValueError("Department name cannot exceed 100 characters")
        return v

    @field_validator("code")
    @classmethod
    def code_uppercase(cls, v: Optional[str]) -> Optional[str]:
        if v:
            v = v.strip().upper()
            if len(v) > 20:
                raise ValueError("Code cannot exceed 20 characters")
        return v


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Department name cannot be empty")
        return v


class DepartmentOut(DepartmentBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    employee_count: Optional[int] = None

    model_config = {"from_attributes": True}


class DepartmentSummary(BaseModel):
    """Lightweight department info used inside EmployeeOut"""
    id: int
    name: str
    code: Optional[str] = None

    model_config = {"from_attributes": True}
