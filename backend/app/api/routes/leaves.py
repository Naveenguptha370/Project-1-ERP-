"""SmartERP - Leave API Routes"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database.database import get_db
from app.core.dependencies import get_current_user, require_manager_or_admin
from app.schemas.leave import LeaveCreate, LeaveUpdate, LeaveReview, LeaveOut
from app.models.leave import LeaveStatus, LeaveType
from app.services import leave_service

router = APIRouter(prefix="/leaves", tags=["HR - Leave Management"])


@router.get("", response_model=List[LeaveOut])
def list_leaves(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    employee_id: Optional[int] = Query(None),
    leave_status: Optional[LeaveStatus] = Query(None, alias="status"),
    leave_type: Optional[LeaveType] = Query(None, alias="type"),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List leave requests with optional filters."""
    return leave_service.get_all_leaves(
        db, skip=skip, limit=limit,
        employee_id=employee_id,
        leave_status=leave_status,
        leave_type=leave_type,
        date_from=date_from,
        date_to=date_to,
    )


@router.post("", response_model=LeaveOut, status_code=201)
def create_leave(
    data: LeaveCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Submit a new leave request."""
    return leave_service.create_leave(db, data)


@router.get("/{leave_id}", response_model=LeaveOut)
def get_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a specific leave request."""
    return leave_service.get_leave_by_id(db, leave_id)


@router.put("/{leave_id}", response_model=LeaveOut)
def update_leave(
    leave_id: int,
    data: LeaveUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update a pending leave request (only before approval)."""
    return leave_service.update_leave(db, leave_id, data, current_user.id)


@router.post("/{leave_id}/review", response_model=LeaveOut)
def review_leave(
    leave_id: int,
    data: LeaveReview,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager_or_admin),
):
    """Approve or reject a leave request. Requires MANAGER or ADMIN."""
    return leave_service.review_leave(db, leave_id, data, reviewer_id=current_user.id)


@router.post("/{leave_id}/cancel", response_model=LeaveOut)
def cancel_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Cancel own pending leave request."""
    # Find employee linked to this user — for now use employee_id from request
    leave = leave_service.get_leave_by_id(db, leave_id)
    return leave_service.cancel_leave(db, leave_id, employee_id=leave.employee_id)
