def test_create_warehouse(client, auth_headers):
    response = client.post(
        "/api/v1/warehouses",
        headers=auth_headers,
        json={
            "warehouse_code": "WH-CENTRAL",
            "warehouse_name": "Central Distribution Hub",
            "description": "Primary logistics and distribution center",
            "address": "100 Industrial Parkway",
            "city": "Chicago",
            "state": "IL",
            "postal_code": "60601",
            "contact_person": "Robert Vance",
            "phone": "+1-312-555-0199",
            "email": "rvance@smarterp.local",
            "is_active": True
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["warehouse_code"] == "WH-CENTRAL"
    assert data["warehouse_name"] == "Central Distribution Hub"
    assert data["total_units_in_stock"] == 0

def test_duplicate_warehouse_code_rejected(client, auth_headers):
    client.post(
        "/api/v1/warehouses",
        headers=auth_headers,
        json={"warehouse_code": "WH-NORTH", "warehouse_name": "North Facility"}
    )
    res = client.post(
        "/api/v1/warehouses",
        headers=auth_headers,
        json={"warehouse_code": "WH-NORTH", "warehouse_name": "Different Name"}
    )
    assert res.status_code == 409
    assert "already exists" in res.json()["detail"]

def test_update_warehouse(client, auth_headers):
    wh_res = client.post(
        "/api/v1/warehouses",
        headers=auth_headers,
        json={"warehouse_code": "WH-EAST", "warehouse_name": "East Facility"}
    )
    wh_id = wh_res.json()["id"]

    res = client.put(
        f"/api/v1/warehouses/{wh_id}",
        headers=auth_headers,
        json={"warehouse_name": "East Facility Renovated", "city": "Boston"}
    )
    assert res.status_code == 200
    assert res.json()["warehouse_name"] == "East Facility Renovated"
    assert res.json()["city"] == "Boston"

def test_delete_empty_warehouse(client, auth_headers):
    wh_res = client.post(
        "/api/v1/warehouses",
        headers=auth_headers,
        json={"warehouse_code": "WH-DISPOSAL", "warehouse_name": "To Delete"}
    )
    wh_id = wh_res.json()["id"]

    del_res = client.delete(f"/api/v1/warehouses/{wh_id}", headers=auth_headers)
    assert del_res.status_code == 200
    assert del_res.json()["action"] == "deleted"

def test_warehouse_search(client, auth_headers):
    client.post(
        "/api/v1/warehouses",
        headers=auth_headers,
        json={
            "warehouse_code": "WH-AUSTIN",
            "warehouse_name": "Austin Depot",
            "city": "Austin",
            "contact_person": "Sarah Connor"
        }
    )

    res = client.get("/api/v1/warehouses?search=Austin", headers=auth_headers)
    assert res.status_code == 200
    items = res.json()["items"]
    assert any(w["warehouse_code"] == "WH-AUSTIN" for w in items)
