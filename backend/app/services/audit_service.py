from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models.audit_log import AuditLog


def log_audit_event(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """Record an audit trail event for security and compliance."""
    now = datetime.now(timezone.utc)
    log = AuditLog(
        user_id=user_id,
        action=action,
        description=details,
        details=details,
        ip_address=ip_address,
        timestamp=now,
        created_at=now,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


class AuditService:
    @staticmethod
    def log(
        db: Session,
        action: str,
        description: str,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
    ) -> Optional[AuditLog]:
        try:
            log_entry = AuditLog(
                user_id=user_id,
                action=action,
                description=description,
                ip_address=ip_address,
            )
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            return log_entry
        except SQLAlchemyError:
            db.rollback()
            return None
