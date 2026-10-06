"""SmartERP - Employee Service (Business Logic)"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from fastapi import HTTPException, status
from app.models.employee import Employee, EmployeeStatus
from app.models.department import Department
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from typing import List, Optional
import re


def _generate_employee_id(db: Session) -> str:
    """Auto-generate next available employee ID like EMP001."""
    last = db.query(Employee).order_by(Employee.id.desc()).first()
    next_num = (last.id + 1) if last else 1
    return f"EMP{next_num:04d}"


def get_all_employees(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    status: Optional[EmployeeStatus] = None,
) -> List[Employee]:
    q = db.query(Employee).options(joinedload(Employee.department))

    if search:
        term = f"%{search}%"
        q = q.filter(
            or_(
                Employee.first_name.ilike(term),
                Employee.last_name.ilike(term),
                Employee.email.ilike(term),
                Employee.employee_id.ilike(term),
                Employee.job_title.ilike(term),
            )
        )

    if department_id is not None:
        q = q.filter(Employee.department_id == department_id)

    if status is not None:
        q = q.filter(Employee.status == status)

    return q.order_by(Employee.first_name, Employee.last_name).offset(skip).limit(limit).all()


def get_employee_count(
    db: Session,
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    status: Optional[EmployeeStatus] = None,
) -> int:
    q = db.query(func.count(Employee.id))
    if search:
        term = f"%{search}%"
        q = q.filter(
            or_(
                Employee.first_name.ilike(term),
                Employee.last_name.ilike(term),
                Employee.email.ilike(term),
                Employee.employee_id.ilike(term),
            )
        )
    if department_id is not None:
        q = q.filter(Employee.department_id == department_id)
    if status is not None:
        q = q.filter(Employee.status == status)
    return q.scalar()


def get_employee_by_id(db: Session, emp_id: int) -> Employee:
    emp = db.query(Employee).options(joinedload(Employee.department)).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Employee {emp_id} not found")
    return emp


def create_employee(db: Session, data: EmployeeCreate) -> Employee:
    # Check duplicate email
    if db.query(Employee).filter(func.lower(Employee.email) == data.email.lower()).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered for another employee")

    # Validate department
    if data.department_id:
        dept = db.query(Department).filter(Department.id == data.department_id).first()
        if not dept:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Department {data.department_id} not found")

    emp_data = data.model_dump(exclude={"employee_id"})

    # Auto-generate employee_id
    employee_id = data.employee_id or _generate_employee_id(db)

    # Ensure uniqueness of custom employee_id
    if db.query(Employee).filter(Employee.employee_id == employee_id).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Employee ID '{employee_id}' already exists")

    employee = Employee(**emp_data, employee_id=employee_id)
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return db.query(Employee).options(joinedload(Employee.department)).filter(Employee.id == employee.id).first()


def update_employee(db: Session, emp_id: int, data: EmployeeUpdate) -> Employee:
    emp = get_employee_by_id(db, emp_id)
    updates = data.model_dump(exclude_unset=True)

    if "email" in updates:
        existing = db.query(Employee).filter(
            func.lower(Employee.email) == updates["email"].lower(),
            Employee.id != emp_id
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")

    if "department_id" in updates and updates["department_id"]:
        dept = db.query(Department).filter(Department.id == updates["department_id"]).first()
        if not dept:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    for field, value in updates.items():
        setattr(emp, field, value)

    db.commit()
    db.refresh(emp)
    return db.query(Employee).options(joinedload(Employee.department)).filter(Employee.id == emp_id).first()


def deactivate_employee(db: Session, emp_id: int) -> Employee:
    """Soft-delete: set status to TERMINATED and is_active=False."""
    emp = get_employee_by_id(db, emp_id)
    emp.status = EmployeeStatus.TERMINATED
    emp.is_active = False
    db.commit()
    db.refresh(emp)
    return emp


def get_hr_summary(db: Session) -> dict:
    from app.models.attendance import Attendance, AttendanceStatus
    from app.models.leave import Leave, LeaveStatus
    from datetime import date

    total_employees = db.query(func.count(Employee.id)).filter(Employee.is_active == True).scalar()
    total_departments = db.query(func.count(Department.id)).filter(Department.is_active == True).scalar()
    present_today = db.query(func.count(Attendance.id)).filter(
        Attendance.date == date.today(),
        Attendance.status == AttendanceStatus.PRESENT
    ).scalar()
    pending_leaves = db.query(func.count(Leave.id)).filter(Leave.status == LeaveStatus.PENDING).scalar()

    return {
        "total_employees": total_employees,
        "total_departments": total_departments,
        "present_today": present_today,
        "pending_leaves": pending_leaves,
    }
