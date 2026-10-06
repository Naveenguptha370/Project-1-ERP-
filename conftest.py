import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
if not os.path.exists(backend_path):
    backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.database.session import Base, get_db
from app.database.seed import seed_database
from app.main import app

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_smarterp.db"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_smarterp.db"):
        try:
            os.remove("./test_smarterp.db")
        except Exception:
            pass


@pytest.fixture(scope="function")
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin_token(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admin", "password": "AdminPassword123!"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture(scope="function")
def manager_token(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "manager", "password": "ManagerPassword123!"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture(scope="function")
def employee_token(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "employee", "password": "EmployeePassword123!"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]
