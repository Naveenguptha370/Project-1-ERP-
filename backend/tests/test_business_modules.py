from decimal import Decimal
from uuid import uuid4

from app.core.security import create_access_token, get_password_hash
from app.models.business import CRMActivity
from app.models.inventory import WarehouseStock
from app.models.category import Category
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.models.warehouse import Warehouse


def test_public_registration_cannot_assign_admin_role(client, db):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Unprivileged User",
            "email": "unprivileged@example.com",
            "username": "unprivileged",
            "password": "SecurePassword123",
            "role": "ADMIN",
        },
    )

    assert response.status_code == 201
    user = db.query(User).filter(User.username == "unprivileged").one()
    assert user.is_superuser is False
    assert [role.name for role in user.roles] == ["EMPLOYEE"]


def test_crm_lead_conversion_creates_customer_and_activity(client, auth_headers):
    lead_response = client.post(
        "/api/v1/crm/leads",
        headers=auth_headers,
        json={
            "name": "Jordan Lee",
            "company_name": "Acme Ltd",
            "email": "jordan@example.com",
            "status": "Qualified",
            "estimated_value": 2500,
        },
    )
    assert lead_response.status_code == 201
    lead_id = lead_response.json()["id"]

    conversion = client.post(f"/api/v1/crm/leads/{lead_id}/convert", headers=auth_headers)
    assert conversion.status_code == 201
    customer_id = conversion.json()["id"]
    assert conversion.json()["email"] == "jordan@example.com"

    duplicate_conversion = client.post(f"/api/v1/crm/leads/{lead_id}/convert", headers=auth_headers)
    assert duplicate_conversion.status_code == 409
    activities = client.get(f"/api/v1/crm/activities?lead_id={lead_id}", headers=auth_headers)
    assert activities.status_code == 200
    assert any(activity["customer_id"] == customer_id for activity in activities.json())

    interaction = client.post(
        "/api/v1/crm/activities",
        headers=auth_headers,
        json={"customer_id": customer_id, "action": "Call", "details": "Discussed requirements"},
    )
    assert interaction.status_code == 201
    customer_history = client.get(
        f"/api/v1/crm/activities?customer_id={customer_id}",
        headers=auth_headers,
    )
    assert any(item["action"] == "Call" for item in customer_history.json())


def test_received_purchase_order_updates_stock_transactionally(client, auth_headers, db):
    suffix = uuid4().hex[:8]
    product = Product(
        product_code=f"PO-{suffix}",
        sku=f"PO-SKU-{suffix}",
        product_name="Procurement test product",
        cost_price=Decimal("12.50"),
        selling_price=Decimal("20.00"),
    )
    warehouse = Warehouse(
        warehouse_code=f"PO-WH-{suffix}",
        warehouse_name=f"PO warehouse {suffix}",
    )
    db.add_all([product, warehouse])
    db.commit()

    supplier = client.post(
        "/api/v1/procurement/suppliers",
        headers=auth_headers,
        json={"supplier_code": f"SUP-{suffix}", "company_name": "Test Supplier"},
    )
    assert supplier.status_code == 201

    order = client.post(
        "/api/v1/procurement/purchase-orders",
        headers=auth_headers,
        json={
            "supplier_id": supplier.json()["id"],
            "warehouse_id": warehouse.id,
            "items": [{"product_id": product.id, "quantity": 4}],
        },
    )
    assert order.status_code == 201, order.text
    assert Decimal(order.json()["total_amount"]) == Decimal("50.00")

    ordered = client.patch(
        f"/api/v1/procurement/purchase-orders/{order.json()['id']}/status",
        headers=auth_headers,
        json={"status": "Ordered"},
    )
    assert ordered.status_code == 200
    received = client.patch(
        f"/api/v1/procurement/purchase-orders/{order.json()['id']}/status",
        headers=auth_headers,
        json={"status": "Received"},
    )
    assert received.status_code == 200

    stock = db.query(WarehouseStock).filter_by(product_id=product.id, warehouse_id=warehouse.id).one()
    movement = db.query(StockMovement).filter_by(reference_id=order.json()["order_number"]).one()
    assert stock.quantity_on_hand == 4
    assert stock.available_quantity == 4
    assert movement.quantity_after == 4
    assert received.json()["status"] == "Received"


def test_finance_expense_requires_independent_manager_review(client, auth_headers, db):
    submitted = client.post(
        "/api/v1/finance/expenses",
        headers=auth_headers,
        json={"category": "Travel", "description": "Client visit", "amount": "75.50"},
    )
    assert submitted.status_code == 201
    expense_id = submitted.json()["id"]

    self_review = client.patch(
        f"/api/v1/finance/expenses/{expense_id}/review",
        headers=auth_headers,
        json={"status": "Approved"},
    )
    assert self_review.status_code == 403

    reviewer = User(
        full_name="Independent Reviewer",
        username=f"reviewer-{uuid4().hex[:8]}",
        email=f"reviewer-{uuid4().hex[:8]}@example.com",
        hashed_password=get_password_hash("ReviewPassword123"),
        is_active=True,
        is_superuser=True,
    )
    db.add(reviewer)
    db.commit()
    reviewer_headers = {
        "Authorization": f"Bearer {create_access_token(data={'sub': reviewer.username})}"
    }
    approval = client.patch(
        f"/api/v1/finance/expenses/{expense_id}/review",
        headers=reviewer_headers,
        json={"status": "Approved", "review_note": "Receipt checked"},
    )
    assert approval.status_code == 200
    assert approval.json()["status"] == "Approved"


def test_reports_return_database_derived_values(client, auth_headers):
    response = client.get("/api/v1/reports/dashboard", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert set(data) == {"as_of", "sales", "crm", "inventory", "procurement", "finance", "hr"}
    assert data["crm"]["customers"] >= 0
    assert data["inventory"]["stock_value"] >= 0
    for report_name in ("sales", "inventory", "finance"):
        report = client.get(f"/api/v1/reports/{report_name}", headers=auth_headers)
        assert report.status_code == 200, report.text


def test_sales_analytics_uses_actual_records_only(client, auth_headers):
    response = client.get("/api/v1/sales/analytics/dashboard", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["top_products"] == []
    assert all(
        point[field] == 0
        for point in data["monthly_trends"]
        for field in ("quotations", "orders", "invoiced", "collected")
    )


def test_sales_product_catalog_serializes_inventory_products(client, auth_headers, db):
    suffix = uuid4().hex[:8]
    category = Category(
        category_code=f"CAT-{suffix}",
        category_name=f"Sales catalog category {suffix}",
    )
    db.add(category)
    db.flush()
    product = Product(
        product_code=f"CAT-PRD-{suffix}",
        sku=f"CAT-SKU-{suffix}",
        product_name="Catalog test product",
        category_id=category.id,
        unit="pcs",
        cost_price=12.50,
        selling_price=20.00,
        tax_percentage=18,
        is_active=True,
    )
    db.add(product)
    db.commit()

    response = client.get("/api/v1/master/products", headers=auth_headers)

    assert response.status_code == 200, response.text
    catalog_product = next(
        item for item in response.json() if item["id"] == product.id
    )
    assert catalog_product["name"] == product.product_name
    assert catalog_product["category"] == category.category_name
    assert catalog_product["unit_price"] == 20.0
    assert catalog_product["tax_rate"] == 18.0


def test_crm_routes_require_authentication(client):
    response = client.get("/api/v1/crm/leads")
    assert response.status_code == 401


def test_literal_test_token_is_not_accepted(client):
    response = client.get(
        "/api/v1/crm/leads",
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 401


def test_employee_cannot_use_manager_only_hr_routes(client):
    registration = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Standard Employee",
            "email": "standard.employee@example.com",
            "username": "standard_employee",
            "password": "StandardPassword123",
        },
    )
    assert registration.status_code == 201
    login = client.post(
        "/api/v1/auth/login",
        json={
            "username_or_email": "standard_employee",
            "password": "StandardPassword123",
        },
    )
    assert login.status_code == 200
    employee_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    response = client.post(
        "/api/v1/departments",
        headers=employee_headers,
        json={"name": "Unauthorized Department"},
    )
    assert response.status_code == 403


def test_logout_revokes_the_current_access_token(client, auth_headers):
    protected_before_logout = client.get("/api/v1/crm/leads", headers=auth_headers)
    assert protected_before_logout.status_code == 200

    logout = client.post("/api/v1/auth/logout", headers=auth_headers)
    assert logout.status_code == 200

    protected_after_logout = client.get("/api/v1/crm/leads", headers=auth_headers)
    assert protected_after_logout.status_code == 401
