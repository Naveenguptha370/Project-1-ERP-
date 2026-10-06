"""SmartERP - Department Service (Business Logic)"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.department import Department
from app.models.employee import Employee
from app.schemas.department import DepartmentCreate, DepartmentUpdate
from typing import List, Optional


def get_all_departments(db: Session, skip: int = 0, limit: int = 100, active_only: bool = False) -> List[Department]:
    q = db.query(Department)
    if active_only:
        q = q.filter(Department.is_active == True)
    return q.order_by(Department.name).offset(skip).limit(limit).all()


def get_department_count(db: Session, active_only: bool = False) -> int:
    q = db.query(func.count(Department.id))
    if active_only:
        q = q.filter(Department.is_active == True)
    return q.scalar()


def get_department_by_id(db: Session, dept_id: int) -> Department:
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Department {dept_id} not found")
    return dept


def create_department(db: Session, data: DepartmentCreate) -> Department:
    # Check duplicate name
    existing = db.query(Department).filter(func.lower(Department.name) == data.name.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Department name already exists")

    # Check duplicate code
    if data.code:
        existing_code = db.query(Department).filter(func.lower(Department.code) == data.code.lower()).first()
        if existing_code:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Department code already exists")

    dept = Department(**data.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


def update_department(db: Session, dept_id: int, data: DepartmentUpdate) -> Department:
    dept = get_department_by_id(db, dept_id)
    updates = data.model_dump(exclude_unset=True)

    if "name" in updates and updates["name"]:
        existing = db.query(Department).filter(
            func.lower(Department.name) == updates["name"].lower(),
            Department.id != dept_id
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Department name already exists")

    if "code" in updates and updates["code"]:
        existing_code = db.query(Department).filter(
            func.lower(Department.code) == updates["code"].lower(),
            Department.id != dept_id
        ).first()
        if existing_code:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Department code already exists")

    for field, value in updates.items():
        setattr(dept, field, value)

    db.commit()
    db.refresh(dept)
    return dept


def delete_department(db: Session, dept_id: int) -> dict:
    dept = get_department_by_id(db, dept_id)
    employee_count = db.query(func.count(Employee.id)).filter(Employee.department_id == dept_id).scalar()
    if employee_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete department with {employee_count} assigned employee(s). Reassign or deactivate them first."
        )
    db.delete(dept)
    db.commit()
    return {"message": f"Department '{dept.name}' deleted successfully"}


def get_department_employees(db: Session, dept_id: int, skip: int = 0, limit: int = 100):
    get_department_by_id(db, dept_id)
    return db.query(Employee).filter(Employee.department_id == dept_id).offset(skip).limit(limit).all()


def get_employee_count_for_dept(db: Session, dept_id: int) -> int:
    return db.query(func.count(Employee.id)).filter(Employee.department_id == dept_id).scalar()
