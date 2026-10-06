"""
SmartERP - Attendance Model
Member 2: HR Management Module
"""
import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, Time,
    Text, ForeignKey, Enum as SAEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base


class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    LATE = "LATE"
    HALF_DAY = "HALF_DAY"
    ON_LEAVE = "ON_LEAVE"
    HOLIDAY = "HOLIDAY"


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    check_in = Column(Time, nullable=True)
    check_out = Column(Time, nullable=True)
    status = Column(SAEnum(AttendanceStatus), default=AttendanceStatus.PRESENT, nullable=False)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Unique: one record per employee per date
    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="uq_attendance_employee_date"),
    )

    # Relationships
    employee = relationship("Employee", back_populates="attendances")

    def __repr__(self):
        return f"<Attendance id={self.id} emp={self.employee_id} date={self.date} status={self.status}>"
