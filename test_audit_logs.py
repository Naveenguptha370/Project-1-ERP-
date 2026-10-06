import pytest


def test_audit_log_created_on_login(client, admin_token):
    # Retrieve audit logs as admin
    response = client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) > 0
    actions = [l["action"] for l in logs]
    assert any("LOGIN" in a or "REGISTRATION" in a for a in actions)


def test_audit_logs_forbidden_for_employee(client, employee_token):
    response = client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {employee_token}"}
    )
    assert response.status_code == 403


def test_my_audit_logs_accessible_by_employee(client, employee_token):
    response = client.get(
        "/api/v1/audit/my-logs",
        headers={"Authorization": f"Bearer {employee_token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
