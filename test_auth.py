import pytest
from app.core.security import verify_password, get_password_hash


def test_password_hashing():
    pwd = "SecurePassword123!"
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_register_user_success(client):
    payload = {
        "full_name": "Test User",
        "email": "testuser@smarterp.com",
        "username": "testuser",
        "password": "TestPassword123!",
        "confirm_password": "TestPassword123!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testuser@smarterp.com"
    assert data["username"] == "testuser"
    assert data["role"] == "EMPLOYEE"
    assert "password" not in data
    assert "hashed_password" not in data


def test_register_duplicate_email(client):
    payload = {
        "full_name": "Duplicate Email User",
        "email": "admin@smarterp.com",
        "username": "new_admin_unique",
        "password": "Password123!",
        "confirm_password": "Password123!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    assert "email" in response.json()["detail"].lower()


def test_register_duplicate_username(client):
    payload = {
        "full_name": "Duplicate Username User",
        "email": "unique_email_123@smarterp.com",
        "username": "admin",
        "password": "Password123!",
        "confirm_password": "Password123!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    assert "username" in response.json()["detail"].lower()


def test_register_password_mismatch(client):
    payload = {
        "full_name": "Mismatch User",
        "email": "mismatch@smarterp.com",
        "username": "mismatchuser",
        "password": "Password123!",
        "confirm_password": "DifferentPassword123!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_login_success(client):
    payload = {
        "username_or_email": "admin",
        "password": "AdminPassword123!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "ADMIN"


def test_login_wrong_password(client):
    payload = {
        "username_or_email": "admin",
        "password": "WrongPassword!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


def test_login_user_not_found(client):
    payload = {
        "username_or_email": "nonexistent_user_999",
        "password": "Password123!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401


def test_get_me_authenticated(client, admin_token):
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin"
    assert data["role"] == "ADMIN"
    assert "ADMIN" in data["roles"]
    assert len(data["permissions"]) > 0


def test_get_me_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_logout(client, admin_token):
    response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert "logged out" in response.json()["message"].lower()
