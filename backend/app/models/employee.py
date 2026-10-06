"""
SmartERP - Employee Model
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


class EmployeeStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ON_LEAVE = "ON_LEAVE"
    TERMINATED = "TERMINATED"


class Gender(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"
    PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY"


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(20), unique=True, nullable=False, index=True)  # e.g. EMP001

    # Personal Info
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    gender = Column(SAEnum(Gender), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    address = Column(Text, nullable=True)
    profile_photo = Column(String(500), nullable=True)

    # Employment Info
    job_title = Column(String(150), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    hire_date = Column(Date, nullable=False)
    salary = Column(Numeric(12, 2), nullable=True)
    status = Column(SAEnum(EmployeeStatus), default=EmployeeStatus.ACTIVE, nullable=False)

    # Emergency Contact
    emergency_contact_name = Column(String(150), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)

    # System fields
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    department = relationship("Department", back_populates="employees")
    attendances = relationship("Attendance", back_populates="employee", lazy="dynamic")
    leaves = relationship("Leave", back_populates="employee", lazy="dynamic")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __repr__(self):
        return f"<Employee id={self.id} emp_id={self.employee_id} name={self.full_name}>"
