import pytest


def test_admin_role_access(client, admin_token):
    response = client.get(
        "/api/v1/auth/admin-only",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert "Administrator" in response.json()["message"]


def test_employee_forbidden_admin_endpoint(client, employee_token):
    response = client.get(
        "/api/v1/auth/admin-only",
        headers={"Authorization": f"Bearer {employee_token}"}
    )
    assert response.status_code == 403


def test_list_users_as_admin(client, admin_token):
    response = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 3


def test_list_users_as_employee_forbidden(client, employee_token):
    response = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {employee_token}"}
    )
    assert response.status_code == 403


def test_list_roles_and_permissions(client, admin_token):
    roles_resp = client.get(
        "/api/v1/users/access/roles",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert roles_resp.status_code == 200
    roles = roles_resp.json()
    role_names = [r["name"] for r in roles]
    assert "ADMIN" in role_names
    assert "MANAGER" in role_names
    assert "EMPLOYEE" in role_names

    perms_resp = client.get(
        "/api/v1/users/access/permissions",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert perms_resp.status_code == 200
    perms = perms_resp.json()
    assert len(perms) > 0
