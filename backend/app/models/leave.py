"""
SmartERP - Leave Model
Member 2: HR Management Module
"""
import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date,
    Text, ForeignKey, Numeric, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base


class LeaveType(str, enum.Enum):
    ANNUAL = "ANNUAL"
    SICK = "SICK"
    MATERNITY = "MATERNITY"
    PATERNITY = "PATERNITY"
    UNPAID = "UNPAID"
    EMERGENCY = "EMERGENCY"
    OTHER = "OTHER"


class LeaveStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class Leave(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False, index=True)

    leave_type = Column(SAEnum(LeaveType), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Numeric(4, 1), nullable=False)
    reason = Column(Text, nullable=False)

    status = Column(SAEnum(LeaveStatus), default=LeaveStatus.PENDING, nullable=False, index=True)

    # Approval tracking
    reviewed_by = Column(Integer, nullable=True)   # user_id from Member 1's users table
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    remarks = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    employee = relationship("Employee", back_populates="leaves")

    def __repr__(self):
        return f"<Leave id={self.id} emp={self.employee_id} type={self.leave_type} status={self.status}>"
