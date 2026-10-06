"""Add clearly labelled, repeat-safe HR examples to the configured SQLite database."""

import sys
from datetime import date, time, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app.database.base  # noqa: F401 - register every ORM model
from app.database import SessionLocal
from app.models.attendance import Attendance, AttendanceStatus
from app.models.department import Department
from app.models.employee import Employee, EmployeeStatus, Gender
from app.models.leave import Leave, LeaveStatus, LeaveType


DEMO_EMPLOYEES = [
    {
        "employee_id": "EMPDEMO001",
        "first_name": "Aarav",
        "last_name": "Mehta",
        "email": "aarav.mehta@example.com",
        "job_title": "Operations Manager",
        "department_code": "DEMO-OPS",
        "department_name": "Demo Operations",
        "salary": 85000,
        "gender": Gender.MALE,
    },
    {
        "employee_id": "EMPDEMO002",
        "first_name": "Diya",
        "last_name": "Sharma",
        "email": "diya.sharma@example.com",
        "job_title": "Sales Executive",
        "department_code": "DEMO-SALES",
        "department_name": "Demo Sales",
        "salary": 62000,
        "gender": Gender.FEMALE,
    },
    {
        "employee_id": "EMPDEMO003",
        "first_name": "Kabir",
        "last_name": "Rao",
        "email": "kabir.rao@example.com",
        "job_title": "Inventory Associate",
        "department_code": "DEMO-OPS",
        "department_name": "Demo Operations",
        "salary": 48000,
        "gender": Gender.MALE,
    },
    {
        "employee_id": "EMPDEMO004",
        "first_name": "Mira",
        "last_name": "Iyer",
        "email": "mira.iyer@example.com",
        "job_title": "Finance Analyst",
        "department_code": "DEMO-FIN",
        "department_name": "Demo Finance",
        "salary": 58000,
        "gender": Gender.FEMALE,
    },
]


def main() -> None:
    added_departments = 0
    added_employees = 0
    added_attendance = 0
    added_leaves = 0
    today = date.today()

    with SessionLocal() as db:
        departments = {}
        for employee_info in DEMO_EMPLOYEES:
            code = employee_info["department_code"]
            department = db.query(Department).filter(Department.code == code).first()
            if department is None:
                department = Department(
                    name=employee_info["department_name"],
                    code=code,
                    description="Sample department for exploring SmartERP HR workflows.",
                )
                db.add(department)
                db.flush()
                added_departments += 1
            departments[code] = department

        employees = {}
        for employee_info in DEMO_EMPLOYEES:
            employee = db.query(Employee).filter(
                Employee.employee_id == employee_info["employee_id"]
            ).first()
            if employee is None:
                employee = Employee(
                    employee_id=employee_info["employee_id"],
                    first_name=employee_info["first_name"],
                    last_name=employee_info["last_name"],
                    email=employee_info["email"],
                    job_title=employee_info["job_title"],
                    department_id=departments[employee_info["department_code"]].id,
                    hire_date=today - timedelta(days=180),
                    salary=employee_info["salary"],
                    status=EmployeeStatus.ACTIVE,
                    gender=employee_info["gender"],
                    address="Sample address - replace with real employee information.",
                    is_active=True,
                )
                db.add(employee)
                db.flush()
                added_employees += 1
            elif employee.email.endswith("@demo.smarterp.local"):
                employee.email = employee_info["email"]
            employees[employee_info["employee_id"]] = employee

        for employee_id in ("EMPDEMO001", "EMPDEMO002", "EMPDEMO004"):
            employee = employees[employee_id]
            record = db.query(Attendance).filter(
                Attendance.employee_id == employee.id,
                Attendance.date == today,
            ).first()
            if record is None:
                db.add(
                    Attendance(
                        employee_id=employee.id,
                        date=today,
                        check_in=time(9, 0),
                        check_out=time(17, 30),
                        status=AttendanceStatus.PRESENT,
                        remarks="DEMO SAMPLE — replace with actual attendance.",
                    )
                )
                added_attendance += 1

        leave_employee = employees["EMPDEMO003"]
        leave_start = today + timedelta(days=14)
        leave = db.query(Leave).filter(
            Leave.employee_id == leave_employee.id,
            Leave.reason == "DEMO SAMPLE — pending annual leave request.",
        ).first()
        if leave is None:
            db.add(
                Leave(
                    employee_id=leave_employee.id,
                    leave_type=LeaveType.ANNUAL,
                    start_date=leave_start,
                    end_date=leave_start + timedelta(days=2),
                    total_days=3,
                    reason="DEMO SAMPLE — pending annual leave request.",
                    status=LeaveStatus.PENDING,
                )
            )
            added_leaves += 1

        db.commit()

        print(
            "Demo HR data ready: "
            f"{db.query(Employee).filter(Employee.employee_id.like('EMPDEMO%')).count()} employees, "
            f"{db.query(Department).filter(Department.code.like('DEMO-%')).count()} departments, "
            f"{db.query(Attendance).filter(Attendance.remarks.like('DEMO SAMPLE%')).count()} sample attendance records, "
            f"{db.query(Leave).filter(Leave.reason.like('DEMO SAMPLE%')).count()} sample leave request. "
            f"Added this run: {added_departments} departments, {added_employees} employees, "
            f"{added_attendance} attendance records, {added_leaves} leave request."
        )


if __name__ == "__main__":
    main()
