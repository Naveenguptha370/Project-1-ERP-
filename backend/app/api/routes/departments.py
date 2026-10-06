"""SmartERP - Department API Routes"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.database import get_db
from app.core.dependencies import get_current_user, require_manager_or_admin
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentOut
from app.schemas.employee import EmployeeOut
from app.schemas.common import MessageResponse
from app.services import department_service

router = APIRouter(prefix="/departments", tags=["HR - Departments"])


@router.get("", response_model=List[DepartmentOut])
def list_departments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List all departments."""
    depts = department_service.get_all_departments(db, skip=skip, limit=limit, active_only=active_only)
    result = []
    for d in depts:
        d_out = DepartmentOut.model_validate(d)
        d_out.employee_count = department_service.get_employee_count_for_dept(db, d.id)
        result.append(d_out)
    return result


@router.post("", response_model=DepartmentOut, status_code=201)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager_or_admin),
):
    """Create a new department. Requires MANAGER or ADMIN role."""
    dept = department_service.create_department(db, data)
    d_out = DepartmentOut.model_validate(dept)
    d_out.employee_count = 0
    return d_out


@router.get("/{dept_id}", response_model=DepartmentOut)
def get_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a single department by ID."""
    dept = department_service.get_department_by_id(db, dept_id)
    d_out = DepartmentOut.model_validate(dept)
    d_out.employee_count = department_service.get_employee_count_for_dept(db, dept_id)
    return d_out


@router.put("/{dept_id}", response_model=DepartmentOut)
def update_department(
    dept_id: int,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager_or_admin),
):
    """Update a department. Requires MANAGER or ADMIN role."""
    dept = department_service.update_department(db, dept_id, data)
    d_out = DepartmentOut.model_validate(dept)
    d_out.employee_count = department_service.get_employee_count_for_dept(db, dept_id)
    return d_out


@router.delete("/{dept_id}", response_model=MessageResponse)
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager_or_admin),
):
    """Delete a department (only if no employees are assigned)."""
    return department_service.delete_department(db, dept_id)


@router.get("/{dept_id}/employees", response_model=List[EmployeeOut])
def get_department_employees(
    dept_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List all employees in a department."""
    return department_service.get_department_employees(db, dept_id, skip=skip, limit=limit)
