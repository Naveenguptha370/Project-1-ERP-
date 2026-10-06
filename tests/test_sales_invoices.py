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


def test_invoice_and_payment_auto_settlement():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a commercial invoice
    inv_payload = {
        "customer_name": "Titanium Softwares",
        "customer_email": "accounts@titaniumsoft.io",
        "customer_address": "HITEC City, Hyderabad",
        "payment_terms": "Net 15 Days",
        "items": [
            {
                "product_name": "Custom Module Development",
                "quantity": 10,
                "unit_price": 5000.0,
                "discount_percent": 0.0,
                "tax_rate": 18.0,
            }
        ]
    }
    res_inv = client.post("/api/v1/sales/invoices", json=inv_payload, headers=headers)
    assert res_inv.status_code == 201
    invoice = res_inv.json()
    inv_id = invoice["id"]
    # Total: 50,000 + 18% tax (9000) = 59,000
    assert invoice["total_amount"] == 59000.0
    assert invoice["balance_due"] == 59000.0
    assert invoice["status"] == "Unpaid"

    # 2. Make Partial Payment of 20,000
    pay_part = {
        "invoice_id": inv_id,
        "customer_name": "Titanium Softwares",
        "amount": 20000.0,
        "payment_method": "UPI",
        "reference_number": "UPI/2026/0991823"
    }
    res_pay1 = client.post("/api/v1/sales/payments", json=pay_part, headers=headers)
    assert res_pay1.status_code == 201
    
    # Verify invoice status is now Partially Paid
    inv_check1 = client.get(f"/api/v1/sales/invoices/{inv_id}", headers=headers).json()
    assert inv_check1["amount_paid"] == 20000.0
    assert inv_check1["balance_due"] == 39000.0
    assert inv_check1["status"] == "Partially Paid"

    # 3. Pay the remaining balance (39,000)
    pay_full = {
        "invoice_id": inv_id,
        "customer_name": "Titanium Softwares",
        "amount": 39000.0,
        "payment_method": "Bank Transfer",
        "reference_number": "UTR-ICICI-4910283"
    }
    res_pay2 = client.post("/api/v1/sales/payments", json=pay_full, headers=headers)
    assert res_pay2.status_code == 201

    # Verify invoice status is now Paid with 0 balance
    inv_check2 = client.get(f"/api/v1/sales/invoices/{inv_id}", headers=headers).json()
    assert inv_check2["amount_paid"] == 59000.0
    assert inv_check2["balance_due"] == 0.0
    assert inv_check2["status"] == "Paid"
