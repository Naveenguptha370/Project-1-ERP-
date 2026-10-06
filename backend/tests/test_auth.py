from app.core.security import verify_password
from app.models.audit_log import AuditLog
from app.models.user import User


def test_user_registration(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Alice Cooper",
            "email": "alice@example.com",
            "username": "alice",
            "password": "SecurePassword123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "alice"
    assert data["email"] == "alice@example.com"
    assert "password" not in data

def test_duplicate_email_registration_rejected(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Bob Original",
            "email": "bob@example.com",
            "username": "bob1",
            "password": "Password123"
        }
    )
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Bob Duplicate",
            "email": "bob@example.com",
            "username": "bob2",
            "password": "Password123"
        }
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

def test_duplicate_username_registration_rejected(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Charlie One",
            "email": "charlie1@example.com",
            "username": "charlie",
            "password": "Password123"
        }
    )
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Charlie Two",
            "email": "charlie2@example.com",
            "username": "charlie",
            "password": "Password123"
        }
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

def test_password_is_hashed_in_database(client, db):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Diana Prince",
            "email": "diana@example.com",
            "username": "diana",
            "password": "MySecretPassword99"
        }
    )
    user = db.query(User).filter(User.username == "diana").first()
    assert user is not None
    assert user.hashed_password != "MySecretPassword99"
    assert verify_password("MySecretPassword99", user.hashed_password)

def test_login_success_and_jwt(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Edward Norton",
            "email": "edward@example.com",
            "username": "edward",
            "password": "Password123!"
        }
    )
    response = client.post(
        "/api/v1/auth/login",
        json={
            "username_or_email": "edward",
            "password": "Password123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "edward"

def test_wrong_password_rejected(client):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "username_or_email": "test_admin",
            "password": "IncorrectPassword"
        }
    )
    assert response.status_code == 401
    assert "Incorrect username/email or password" in response.json()["detail"]

def test_get_current_user_me(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "test_admin"

def test_unauthorized_access_rejected(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

def test_admin_only_access(client, auth_headers):
    response = client.get("/api/v1/auth/admin-only", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["role"] == "ADMIN"

def test_audit_log_created_on_login(client, db):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Frank Castle",
            "email": "frank@example.com",
            "username": "frank",
            "password": "CastlePassword123"
        }
    )
    client.post(
        "/api/v1/auth/login",
        json={
            "username_or_email": "frank",
            "password": "CastlePassword123"
        }
    )
    audit = db.query(AuditLog).filter(AuditLog.action == "LOGIN").order_by(AuditLog.id.desc()).first()
    assert audit is not None
    assert "frank" in audit.description
