from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, AuditLog
from app.schemas.auth import UserOut

router = APIRouter(prefix="/users", tags=["User Management & Security"])


@router.get("", response_model=List[UserOut])
def get_users(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "MANAGER"])),
):
    """List system users (Admin & Manager access)."""
    return db.query(User).offset(skip).limit(limit).all()


@router.get("/audit-logs")
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"])),
):
    """Retrieve security audit trails (Admin only)."""
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "ip_address": log.ip_address,
            "details": log.details,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        }
        for log in logs
    ]
