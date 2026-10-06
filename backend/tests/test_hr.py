"""
SmartERP - HR Module Tests (Member 2)
Run: cd backend && pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.database import Base, get_db
from app.main import app
from app.core.security import create_access_token, get_password_hash
from app.models.user import Role, User
from datetime import date, timedelta

from sqlalchemy.pool import StaticPool

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True, scope="module")
def setup_hr_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    admin_role = Role(name="ADMIN", description="Test administrator")
    admin = User(
        full_name="Test Administrator",
        username="test_admin",
        email="test_admin@example.com",
        hashed_password=get_password_hash("TestPassword123"),
        is_active=True,
        is_superuser=True,
        roles=[admin_role],
    )
    db.add(admin)
    db.commit()
    db.close()
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)

HEADERS = {
    "Authorization": f"Bearer {create_access_token(data={'sub': 'test_admin'})}"
}

# ─── Department Tests ──────────────────────────────────────────────────────────

class TestDepartments:
    def test_create_department(self):
        r = client.post("/api/v1/departments", json={"name": "Test Dept", "code": "TST"}, headers=HEADERS)
        assert r.status_code == 201
        data = r.json()
        assert data["name"] == "Test Dept"
        assert data["code"] == "TST"

    def test_create_duplicate_department(self):
        client.post("/api/v1/departments", json={"name": "Dup Dept"}, headers=HEADERS)
        r = client.post("/api/v1/departments", json={"name": "Dup Dept"}, headers=HEADERS)
        assert r.status_code == 409

    def test_list_departments(self):
        r = client.get("/api/v1/departments", headers=HEADERS)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_department(self):
        r = client.post("/api/v1/departments", json={"name": "Get Dept"}, headers=HEADERS)
        dept_id = r.json()["id"]
        r2 = client.get(f"/api/v1/departments/{dept_id}", headers=HEADERS)
        assert r2.status_code == 200
        assert r2.json()["id"] == dept_id

    def test_update_department(self):
        r = client.post("/api/v1/departments", json={"name": "Old Name"}, headers=HEADERS)
        dept_id = r.json()["id"]
        r2 = client.put(f"/api/v1/departments/{dept_id}", json={"name": "New Name"}, headers=HEADERS)
        assert r2.status_code == 200
        assert r2.json()["name"] == "New Name"

    def test_delete_empty_department(self):
        r = client.post("/api/v1/departments", json={"name": "Delete Me"}, headers=HEADERS)
        dept_id = r.json()["id"]
        r2 = client.delete(f"/api/v1/departments/{dept_id}", headers=HEADERS)
        assert r2.status_code == 200

    def test_get_nonexistent_department(self):
        r = client.get("/api/v1/departments/99999", headers=HEADERS)
        assert r.status_code == 404


# ─── Employee Tests ────────────────────────────────────────────────────────────

class TestEmployees:
    def _create_dept(self, name="Emp Test Dept"):
        r = client.post("/api/v1/departments", json={"name": name}, headers=HEADERS)
        return r.json()["id"]

    def _create_employee(self, email="emp@test.com", dept_id=None):
        return client.post("/api/v1/employees", json={
            "first_name": "John", "last_name": "Doe",
            "email": email, "job_title": "Tester",
            "hire_date": str(date.today()),
            "department_id": dept_id,
        }, headers=HEADERS)

    def test_create_employee(self):
        dept_id = self._create_dept("Emp Dept 1")
        r = self._create_employee("john1@test.com", dept_id)
        assert r.status_code == 201
        data = r.json()
        assert data["email"] == "john1@test.com"
        assert "EMP" in data["employee_id"]

    def test_duplicate_email_rejected(self):
        self._create_employee("dup@test.com")
        r2 = self._create_employee("dup@test.com")
        assert r2.status_code == 409

    def test_list_employees(self):
        r = client.get("/api/v1/employees", headers=HEADERS)
        assert r.status_code == 200

    def test_search_employees(self):
        self._create_employee("search_me@test.com")
        r = client.get("/api/v1/employees?search=search_me", headers=HEADERS)
        assert r.status_code == 200

    def test_get_employee(self):
        r = self._create_employee("get_emp@test.com")
        emp_id = r.json()["id"]
        r2 = client.get(f"/api/v1/employees/{emp_id}", headers=HEADERS)
        assert r2.status_code == 200

    def test_update_employee(self):
        r = self._create_employee("upd_emp@test.com")
        emp_id = r.json()["id"]
        r2 = client.put(f"/api/v1/employees/{emp_id}", json={"job_title": "Senior Tester"}, headers=HEADERS)
        assert r2.status_code == 200
        assert r2.json()["job_title"] == "Senior Tester"

    def test_deactivate_employee(self):
        r = self._create_employee("deact@test.com")
        emp_id = r.json()["id"]
        r2 = client.delete(f"/api/v1/employees/{emp_id}", headers=HEADERS)
        assert r2.status_code == 200
        assert r2.json()["status"] == "TERMINATED"

    def test_invalid_department_rejected(self):
        r = client.post("/api/v1/employees", json={
            "first_name": "Bad", "last_name": "Dept",
            "email": "baddept@test.com", "job_title": "Test",
            "hire_date": str(date.today()), "department_id": 99999,
        }, headers=HEADERS)
        assert r.status_code == 404

    def test_hr_summary(self):
        r = client.get("/api/v1/employees/summary", headers=HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert "total_employees" in data
        assert "total_departments" in data


# ─── Attendance Tests ──────────────────────────────────────────────────────────

class TestAttendance:
    def _create_employee(self, email):
        r = client.post("/api/v1/employees", json={
            "first_name": "Att", "last_name": "Tester",
            "email": email, "job_title": "Tester",
            "hire_date": str(date.today()),
        }, headers=HEADERS)
        return r.json()["id"]

    def test_create_attendance(self):
        emp_id = self._create_employee("att1@test.com")
        r = client.post("/api/v1/attendance", json={
            "employee_id": emp_id, "date": str(date.today()),
            "check_in": "09:00:00", "check_out": "18:00:00", "status": "PRESENT"
        }, headers=HEADERS)
        assert r.status_code == 201

    def test_duplicate_attendance_rejected(self):
        emp_id = self._create_employee("att2@test.com")
        today = str(date.today() - timedelta(days=1))
        client.post("/api/v1/attendance", json={"employee_id": emp_id, "date": today, "status": "PRESENT"}, headers=HEADERS)
        r2 = client.post("/api/v1/attendance", json={"employee_id": emp_id, "date": today, "status": "ABSENT"}, headers=HEADERS)
        assert r2.status_code == 409

    def test_list_attendance(self):
        r = client.get("/api/v1/attendance", headers=HEADERS)
        assert r.status_code == 200

    def test_filter_by_employee(self):
        emp_id = self._create_employee("att3@test.com")
        r = client.get(f"/api/v1/attendance?employee_id={emp_id}", headers=HEADERS)
        assert r.status_code == 200

    def test_checkout_before_checkin_rejected(self):
        emp_id = self._create_employee("att4@test.com")
        r = client.post("/api/v1/attendance", json={
            "employee_id": emp_id,
            "date": str(date.today() - timedelta(days=2)),
            "check_in": "18:00:00",
            "check_out": "09:00:00",
            "status": "PRESENT"
        }, headers=HEADERS)
        assert r.status_code == 422

    def test_update_attendance(self):
        emp_id = self._create_employee("att5@test.com")
        r = client.post("/api/v1/attendance", json={
            "employee_id": emp_id,
            "date": str(date.today() - timedelta(days=3)),
            "status": "PRESENT"
        }, headers=HEADERS)
        att_id = r.json()["id"]
        r2 = client.put(f"/api/v1/attendance/{att_id}", json={"status": "LATE"}, headers=HEADERS)
        assert r2.status_code == 200
        assert r2.json()["status"] == "LATE"


# ─── Leave Tests ───────────────────────────────────────────────────────────────

class TestLeaves:
    def _create_employee(self, email):
        r = client.post("/api/v1/employees", json={
            "first_name": "Leave", "last_name": "Tester",
            "email": email, "job_title": "Tester",
            "hire_date": str(date.today()),
        }, headers=HEADERS)
        return r.json()["id"]

    def test_create_leave(self):
        emp_id = self._create_employee("leave1@test.com")
        future = date.today() + timedelta(days=10)
        r = client.post("/api/v1/leaves", json={
            "employee_id": emp_id, "leave_type": "ANNUAL",
            "start_date": str(future), "end_date": str(future + timedelta(days=2)),
            "reason": "Vacation"
        }, headers=HEADERS)
        assert r.status_code == 201
        data = r.json()
        assert data["status"] == "PENDING"
        assert data["total_days"] == 3.0

    def test_end_before_start_rejected(self):
        emp_id = self._create_employee("leave2@test.com")
        r = client.post("/api/v1/leaves", json={
            "employee_id": emp_id, "leave_type": "SICK",
            "start_date": str(date.today() + timedelta(days=5)),
            "end_date": str(date.today() + timedelta(days=3)),
            "reason": "Test"
        }, headers=HEADERS)
        assert r.status_code == 422

    def test_approve_leave(self):
        emp_id = self._create_employee("leave3@test.com")
        future = date.today() + timedelta(days=20)
        r = client.post("/api/v1/leaves", json={
            "employee_id": emp_id, "leave_type": "ANNUAL",
            "start_date": str(future), "end_date": str(future + timedelta(days=1)),
            "reason": "Trip"
        }, headers=HEADERS)
        leave_id = r.json()["id"]
        r2 = client.post(f"/api/v1/leaves/{leave_id}/review",
                         json={"status": "APPROVED", "remarks": "Approved"}, headers=HEADERS)
        assert r2.status_code == 200
        assert r2.json()["status"] == "APPROVED"

    def test_reject_leave(self):
        emp_id = self._create_employee("leave4@test.com")
        future = date.today() + timedelta(days=30)
        r = client.post("/api/v1/leaves", json={
            "employee_id": emp_id, "leave_type": "SICK",
            "start_date": str(future), "end_date": str(future),
            "reason": "Doctor"
        }, headers=HEADERS)
        leave_id = r.json()["id"]
        r2 = client.post(f"/api/v1/leaves/{leave_id}/review",
                         json={"status": "REJECTED", "remarks": "No cover"}, headers=HEADERS)
        assert r2.status_code == 200
        assert r2.json()["status"] == "REJECTED"

    def test_overlapping_leave_rejected(self):
        emp_id = self._create_employee("leave5@test.com")
        future = date.today() + timedelta(days=40)
        client.post("/api/v1/leaves", json={
            "employee_id": emp_id, "leave_type": "ANNUAL",
            "start_date": str(future), "end_date": str(future + timedelta(days=5)),
            "reason": "First"
        }, headers=HEADERS)
        r2 = client.post("/api/v1/leaves", json={
            "employee_id": emp_id, "leave_type": "SICK",
            "start_date": str(future + timedelta(days=2)), "end_date": str(future + timedelta(days=3)),
            "reason": "Second overlapping"
        }, headers=HEADERS)
        assert r2.status_code == 409

    def test_list_leaves(self):
        r = client.get("/api/v1/leaves", headers=HEADERS)
        assert r.status_code == 200

    def test_filter_leaves_by_status(self):
        r = client.get("/api/v1/leaves?status=PENDING", headers=HEADERS)
        assert r.status_code == 200
