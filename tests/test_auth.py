import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["system"] == "SmartERP"
    assert "Member 5" in data["module"]


def test_admin_login_success():
    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admin", "password": "Admin@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "admin"


def test_invalid_login_rejected():
    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admin", "password": "WrongPassword999"}
    )
    assert response.status_code == 401


def test_user_registration_and_login():
    reg_data = {
        "full_name": "Test Sales Agent",
        "username": "testagent",
        "email": "agent@example.com",
        "password": "Password123",
        "confirm_password": "Password123",
        "role": "EMPLOYEE"
    }
    # Register
    res_reg = client.post("/api/v1/auth/register", json=reg_data)
    assert res_reg.status_code in [201, 409]  # 409 if already registered in prior run
    
    # Login with new agent
    res_log = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "testagent", "password": "Password123"}
    )
    assert res_log.status_code == 200
    token = res_log.json()["access_token"]
    
    # Check /me
    res_me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_me.status_code == 200
    assert res_me.json()["username"] == "testagent"
