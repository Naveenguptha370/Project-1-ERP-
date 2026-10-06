from app.core.security import create_access_token, get_password_hash
from app.models.user import Permission, Role, User
from app.routers.auth import ensure_default_roles_and_permissions


def test_employee_can_view_inventory_but_cannot_write(client, db):
    ensure_default_roles_and_permissions(db)
    permission = db.query(Permission).filter(
        Permission.code == "inventory.view"
    ).first()
    assert permission is not None

    employee_role = db.query(Role).filter(Role.name == "EMPLOYEE").first()
    assert employee_role is not None
    assert permission in employee_role.permissions

    employee = User(
        full_name="Inventory Viewer",
        username="inventory_viewer_test",
        email="inventory_viewer_test@example.com",
        hashed_password=get_password_hash("SecurePassword123"),
        is_active=True,
        is_superuser=False,
        roles=[employee_role],
    )
    db.add(employee)
    db.commit()

    headers = {
        "Authorization": f"Bearer {create_access_token(data={'sub': employee.username})}"
    }

    response = client.get("/api/v1/categories", headers=headers)
    assert response.status_code == 200

    response = client.post(
        "/api/v1/categories",
        headers=headers,
        json={"category_code": "EMPLOYEE-CATEGORY", "category_name": "Employee Category"},
    )
    assert response.status_code == 403
