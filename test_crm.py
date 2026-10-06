import pytest


def test_crm_overview_stats(client, admin_token):
    response = client.get(
        "/api/v1/crm/overview",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "customers" in data
    assert "leads" in data
    assert data["customers"]["total_customers"] >= 1
    assert data["leads"]["total_leads"] >= 1


def test_create_customer(client, admin_token):
    payload = {
        "name": "Global Tech Ventures",
        "company_name": "GTV Holdings",
        "email": "partnerships@gtv.example.com",
        "phone": "+1 (555) 999-8888",
        "industry": "Technology",
        "customer_type": "ENTERPRISE",
        "status": "ACTIVE",
        "annual_revenue": 5000000.00,
        "credit_limit": 750000.00,
    }
    response = client.post(
        "/api/v1/crm/customers",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Global Tech Ventures"
    assert "customer_code" in data
    assert data["customer_code"].startswith("CUST-")


def test_list_customers_search(client, admin_token):
    response = client.get(
        "/api/v1/crm/customers?search=Acme",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    results = response.json()
    assert len(results) >= 1
    assert "Acme" in results[0]["name"]


def test_create_and_convert_lead(client, admin_token):
    lead_payload = {
        "first_name": "Marcus",
        "last_name": "Vance",
        "email": "m.vance@solarenergy.example.com",
        "phone": "+1 (555) 444-3333",
        "company": "Solar Energy Group",
        "title": "VP of Operations",
        "lead_source": "WEBSITE",
        "lead_status": "QUALIFIED",
        "lead_score": 90,
        "estimated_value": 250000.00,
    }
    lead_resp = client.post(
        "/api/v1/crm/leads",
        json=lead_payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert lead_resp.status_code == 201
    lead_data = lead_resp.json()
    lead_id = lead_data["id"]

    # Convert to Customer
    convert_resp = client.post(
        f"/api/v1/crm/leads/{lead_id}/convert",
        json={"customer_type": "ENTERPRISE", "industry": "Energy"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert convert_resp.status_code == 200
    converted_cust = convert_resp.json()
    assert converted_cust["email"] == "m.vance@solarenergy.example.com"
    assert converted_cust["customer_code"].startswith("CUST-")


def test_log_interaction(client, admin_token):
    # First get a customer
    cust_resp = client.get(
        "/api/v1/crm/customers",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    customers = cust_resp.json()
    assert len(customers) > 0
    cust_id = customers[0]["id"]

    # Log interaction
    inter_payload = {
        "customer_id": cust_id,
        "interaction_type": "CALL",
        "title": "Quarterly Check-in Call",
        "notes": "Discussed system performance and user feedback.",
        "outcome": "COMPLETED",
    }
    response = client.post(
        "/api/v1/crm/interactions",
        json=inter_payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["interaction_type"] == "CALL"
    assert data["title"] == "Quarterly Check-in Call"

    # Check timeline
    timeline_resp = client.get(
        f"/api/v1/crm/customers/{cust_id}/timeline",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert timeline_resp.status_code == 200
    assert len(timeline_resp.json()) > 0
