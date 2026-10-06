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


def test_list_quotations():
    token = get_auth_token()
    response = client.get(
        "/api/v1/sales/quotations",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    quotes = response.json()
    assert isinstance(quotes, list)


def test_create_and_convert_quotation():
    token = get_auth_token()
    quote_payload = {
        "customer_name": "Dynamic Labs Ltd",
        "customer_email": "purchasing@dynamiclabs.org",
        "customer_phone": "+91 98888 77777",
        "customer_address": "Financial District, Hyderabad",
        "notes": "Fast-tracked enterprise inquiry",
        "items": [
            {
                "product_name": "Cloud ERP Seat Addon",
                "quantity": 5,
                "unit_price": 5000.0,
                "discount_percent": 10.0,
                "tax_rate": 18.0,
            }
        ]
    }
    
    # 1. Create Quotation
    res_create = client.post(
        "/api/v1/sales/quotations",
        json=quote_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_create.status_code == 201
    quote = res_create.json()
    assert quote["customer_name"] == "Dynamic Labs Ltd"
    assert quote["subtotal"] == 25000.0
    assert quote["discount_amount"] == 2500.0
    # Tax: 18% of (25000 - 2500 = 22500) = 4050
    assert quote["tax_amount"] == 4050.0
    assert quote["total_amount"] == 26550.0
    
    quote_id = quote["id"]
    
    # 2. Convert Quotation to Sales Order
    res_conv = client.post(
        f"/api/v1/sales/quotations/{quote_id}/convert-to-order",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_conv.status_code == 200
    so = res_conv.json()
    assert so["quotation_id"] == quote_id
    assert so["order_number"].startswith("SO-")
    assert so["total_amount"] == 26550.0
    assert so["status"] == "Confirmed"
