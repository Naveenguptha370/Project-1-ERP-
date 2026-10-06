import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_auth_token():
    res = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admin", "password": "Admin@123"}
    )
    return res.json()["access_token"]


def test_sales_order_lifecycle():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create Order
    order_payload = {
        "customer_name": "Metro Retailers Group",
        "customer_email": "supply@metroretail.in",
        "shipping_address": "Koramangala 4th Block, Bengaluru",
        "status": "Draft",
        "items": [
            {
                "product_name": "Point of Sale Hardware Terminal",
                "quantity": 2,
                "unit_price": 30000.0,
                "discount_percent": 5.0,
                "tax_rate": 18.0,
            }
        ]
    }
    res_order = client.post("/api/v1/sales/orders", json=order_payload, headers=headers)
    assert res_order.status_code == 201
    order = res_order.json()
    order_id = order["id"]
    assert order["status"] == "Draft"
    
    # 2. Update Status to Shipped
    res_status = client.patch(
        f"/api/v1/sales/orders/{order_id}/status",
        json={"status": "Shipped"},
        headers=headers
    )
    assert res_status.status_code == 200
    assert res_status.json()["status"] == "Shipped"

    # 3. Convert Order to Invoice
    res_inv = client.post(
        f"/api/v1/sales/orders/{order_id}/convert-to-invoice",
        headers=headers
    )
    assert res_inv.status_code == 200
    invoice = res_inv.json()
    assert invoice["sales_order_id"] == order_id
    assert invoice["invoice_number"].startswith("INV-")
    assert invoice["status"] == "Unpaid"
    assert invoice["balance_due"] > 0
