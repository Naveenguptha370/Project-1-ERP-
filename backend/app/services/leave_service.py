"""SmartERP - Leave Service (Business Logic)"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from fastapi import HTTPException, status
from app.models.leave import Leave, LeaveStatus, LeaveType
from app.models.employee import Employee
from app.schemas.leave import LeaveCreate, LeaveUpdate, LeaveReview
from typing import List, Optional
from datetime import date, datetime
import math


def _calculate_days(start_date: date, end_date: date) -> float:
    delta = (end_date - start_date).days + 1
    return float(delta)


def get_all_leaves(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    employee_id: Optional[int] = None,
    leave_status: Optional[LeaveStatus] = None,
    leave_type: Optional[LeaveType] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> List[Leave]:
    q = db.query(Leave).options(joinedload(Leave.employee).joinedload(Employee.department))

    if employee_id:
        q = q.filter(Leave.employee_id == employee_id)
    if leave_status:
        q = q.filter(Leave.status == leave_status)
    if leave_type:
        q = q.filter(Leave.leave_type == leave_type)
    if date_from:
        q = q.filter(Leave.start_date >= date_from)
    if date_to:
        q = q.filter(Leave.end_date <= date_to)

    return q.order_by(Leave.created_at.desc()).offset(skip).limit(limit).all()


def get_leave_count(
    db: Session,
    employee_id: Optional[int] = None,
    leave_status: Optional[LeaveStatus] = None,
) -> int:
    q = db.query(func.count(Leave.id))
    if employee_id:
        q = q.filter(Leave.employee_id == employee_id)
    if leave_status:
        q = q.filter(Leave.status == leave_status)
    return q.scalar()


def get_leave_by_id(db: Session, leave_id: int) -> Leave:
    leave = db.query(Leave).options(
        joinedload(Leave.employee).joinedload(Employee.department)
    ).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Leave request {leave_id} not found")
    return leave


def create_leave(db: Session, data: LeaveCreate) -> Leave:
    # Validate employee
    emp = db.query(Employee).filter(Employee.id == data.employee_id, Employee.is_active == True).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found or inactive")

    # Check for overlapping approved/pending leaves
    overlap = db.query(Leave).filter(
        Leave.employee_id == data.employee_id,
        Leave.status.in_([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
        Leave.start_date <= data.end_date,
        Leave.end_date >= data.start_date,
    ).first()
    if overlap:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Employee already has a {overlap.status} leave overlapping these dates ({overlap.start_date} to {overlap.end_date})"
        )

    total_days = _calculate_days(data.start_date, data.end_date)
    leave = Leave(
        **data.model_dump(),
        total_days=total_days,
        status=LeaveStatus.PENDING,
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return get_leave_by_id(db, leave.id)


def update_leave(db: Session, leave_id: int, data: LeaveUpdate, current_user_id: int) -> Leave:
    leave = get_leave_by_id(db, leave_id)

    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update a leave request that is already {leave.status}"
        )

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(leave, field, value)

    # Recalculate days if dates changed
    if "start_date" in updates or "end_date" in updates:
        leave.total_days = _calculate_days(leave.start_date, leave.end_date)

    db.commit()
    db.refresh(leave)
    return get_leave_by_id(db, leave_id)


def review_leave(db: Session, leave_id: int, data: LeaveReview, reviewer_id: int) -> Leave:
    """Approve or reject a leave request."""
    leave = get_leave_by_id(db, leave_id)

    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Leave request is already {leave.status}"
        )

    leave.status = data.status
    leave.reviewed_by = reviewer_id
    leave.reviewed_at = datetime.utcnow()
    if data.remarks:
        leave.remarks = data.remarks

    db.commit()
    db.refresh(leave)
    return get_leave_by_id(db, leave_id)


def cancel_leave(db: Session, leave_id: int, employee_id: int) -> Leave:
    """Employee cancels their own pending leave."""
    leave = get_leave_by_id(db, leave_id)

    if leave.employee_id != employee_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only cancel your own leave requests")

    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel a leave that is already {leave.status}"
        )

    leave.status = LeaveStatus.CANCELLED
    db.commit()
    db.refresh(leave)
    return get_leave_by_id(db, leave_id)


def get_employee_leave_history(db: Session, emp_id: int, skip: int = 0, limit: int = 100) -> List[Leave]:
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return db.query(Leave).filter(Leave.employee_id == emp_id)\
        .order_by(Leave.created_at.desc()).offset(skip).limit(limit).all()
