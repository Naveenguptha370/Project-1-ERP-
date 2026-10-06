"""SmartERP - Employee API Routes"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.database import get_db
from app.core.dependencies import get_current_user, require_manager_or_admin
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut
from app.schemas.attendance import AttendanceOut
from app.schemas.leave import LeaveOut
from app.models.employee import EmployeeStatus
from app.services import employee_service, attendance_service, leave_service

router = APIRouter(prefix="/employees", tags=["HR - Employees"])


@router.get("/summary")
def hr_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """HR overview stats: total employees, departments, present today, pending leaves."""
    return employee_service.get_hr_summary(db)


@router.get("", response_model=List[EmployeeOut])
def list_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    status: Optional[EmployeeStatus] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List employees with optional search and filters."""
    return employee_service.get_all_employees(
        db, skip=skip, limit=limit, search=search,
        department_id=department_id, status=status
    )


@router.post("", response_model=EmployeeOut, status_code=201)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager_or_admin),
):
    """Create a new employee. Requires MANAGER or ADMIN."""
    return employee_service.create_employee(db, data)


@router.get("/{emp_id}", response_model=EmployeeOut)
def get_employee(
    emp_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get employee by ID."""
    return employee_service.get_employee_by_id(db, emp_id)


@router.put("/{emp_id}", response_model=EmployeeOut)
def update_employee(
    emp_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager_or_admin),
):
    """Update an employee. Requires MANAGER or ADMIN."""
    return employee_service.update_employee(db, emp_id, data)


@router.delete("/{emp_id}", response_model=EmployeeOut)
def deactivate_employee(
    emp_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager_or_admin),
):
    """Deactivate (soft-delete) an employee. Preserves historical records."""
    return employee_service.deactivate_employee(db, emp_id)


@router.get("/{emp_id}/attendance", response_model=List[AttendanceOut])
def get_employee_attendance(
    emp_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get attendance history for a specific employee."""
    return attendance_service.get_employee_attendance_history(db, emp_id, skip=skip, limit=limit)


@router.get("/{emp_id}/leaves", response_model=List[LeaveOut])
def get_employee_leaves(
    emp_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get leave history for a specific employee."""
    return leave_service.get_employee_leave_history(db, emp_id, skip=skip, limit=limit)
