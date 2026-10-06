"""SmartERP - Attendance API Routes"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database.database import get_db
from app.core.dependencies import get_current_user, require_manager_or_admin
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate, AttendanceOut
from app.schemas.common import MessageResponse
from app.models.attendance import AttendanceStatus
from app.services import attendance_service

router = APIRouter(prefix="/attendance", tags=["HR - Attendance"])


@router.get("", response_model=List[AttendanceOut])
def list_attendance(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    employee_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    att_status: Optional[AttendanceStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List attendance records with optional filters."""
    return attendance_service.get_all_attendance(
        db, skip=skip, limit=limit,
        employee_id=employee_id,
        date_from=date_from, date_to=date_to,
        att_status=att_status,
    )


@router.post("", response_model=AttendanceOut, status_code=201)
def create_attendance(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager_or_admin),
):
    """Record attendance for an employee. Requires MANAGER or ADMIN."""
    return attendance_service.create_attendance(db, data)


@router.get("/{att_id}", response_model=AttendanceOut)
def get_attendance(
    att_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a single attendance record."""
    return attendance_service.get_attendance_by_id(db, att_id)


@router.put("/{att_id}", response_model=AttendanceOut)
def update_attendance(
    att_id: int,
    data: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager_or_admin),
):
    """Update an attendance record. Requires MANAGER or ADMIN."""
    return attendance_service.update_attendance(db, att_id, data)


@router.delete("/{att_id}", response_model=MessageResponse)
def delete_attendance(
    att_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager_or_admin),
):
    """Delete an attendance record. Requires MANAGER or ADMIN."""
    return attendance_service.delete_attendance(db, att_id)
