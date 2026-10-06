"""SmartERP - Attendance Service (Business Logic)"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate
from typing import List, Optional
from datetime import date


def get_all_attendance(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    employee_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    att_status: Optional[AttendanceStatus] = None,
) -> List[Attendance]:
    q = db.query(Attendance).options(joinedload(Attendance.employee).joinedload(Employee.department))

    if employee_id:
        q = q.filter(Attendance.employee_id == employee_id)
    if date_from:
        q = q.filter(Attendance.date >= date_from)
    if date_to:
        q = q.filter(Attendance.date <= date_to)
    if att_status:
        q = q.filter(Attendance.status == att_status)

    return q.order_by(Attendance.date.desc(), Attendance.employee_id).offset(skip).limit(limit).all()


def get_attendance_count(
    db: Session,
    employee_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    att_status: Optional[AttendanceStatus] = None,
) -> int:
    q = db.query(func.count(Attendance.id))
    if employee_id:
        q = q.filter(Attendance.employee_id == employee_id)
    if date_from:
        q = q.filter(Attendance.date >= date_from)
    if date_to:
        q = q.filter(Attendance.date <= date_to)
    if att_status:
        q = q.filter(Attendance.status == att_status)
    return q.scalar()


def get_attendance_by_id(db: Session, att_id: int) -> Attendance:
    att = db.query(Attendance).options(
        joinedload(Attendance.employee).joinedload(Employee.department)
    ).filter(Attendance.id == att_id).first()
    if not att:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Attendance record {att_id} not found")
    return att


def create_attendance(db: Session, data: AttendanceCreate) -> Attendance:
    # Validate employee exists
    emp = db.query(Employee).filter(Employee.id == data.employee_id, Employee.is_active == True).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found or inactive")

    # Check for duplicate: same employee + same date
    existing = db.query(Attendance).filter(
        Attendance.employee_id == data.employee_id,
        Attendance.date == data.date
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Attendance for employee {data.employee_id} on {data.date} already exists"
        )

    attendance = Attendance(**data.model_dump())
    db.add(attendance)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Duplicate attendance record")
    db.refresh(attendance)
    return get_attendance_by_id(db, attendance.id)


def update_attendance(db: Session, att_id: int, data: AttendanceUpdate) -> Attendance:
    att = get_attendance_by_id(db, att_id)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(att, field, value)
    db.commit()
    db.refresh(att)
    return get_attendance_by_id(db, att_id)


def delete_attendance(db: Session, att_id: int) -> dict:
    att = get_attendance_by_id(db, att_id)
    db.delete(att)
    db.commit()
    return {"message": "Attendance record deleted"}


def get_employee_attendance_history(db: Session, emp_id: int, skip: int = 0, limit: int = 100) -> List[Attendance]:
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return db.query(Attendance).filter(Attendance.employee_id == emp_id)\
        .order_by(Attendance.date.desc()).offset(skip).limit(limit).all()
