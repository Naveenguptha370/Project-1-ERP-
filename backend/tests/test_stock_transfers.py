import pytest


@pytest.fixture
def transfer_setup(client, auth_headers):
    # Category
    cat_res = client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"category_code": "CAT-TRF", "category_name": "Transfer Category"}
    )
    cat_id = cat_res.json()["id"]

    # Warehouses A and B
    wh_a = client.post(
        "/api/v1/warehouses",
        headers=auth_headers,
        json={"warehouse_code": "WH-TRF-A", "warehouse_name": "Warehouse Alpha"}
    ).json()["id"]

    wh_b = client.post(
        "/api/v1/warehouses",
        headers=auth_headers,
        json={"warehouse_code": "WH-TRF-B", "warehouse_name": "Warehouse Beta"}
    ).json()["id"]

    # Product
    prod_id = client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={
            "product_code": "PRD-TRF-01",
            "sku": "SKU-TRF-01",
            "product_name": "Transferable Widget",
            "category_id": cat_id
        }
    ).json()["id"]

    # Stock in 100 units to Warehouse Alpha
    client.post(
        "/api/v1/inventory/stock-in",
        headers=auth_headers,
        json={"product_id": prod_id, "warehouse_id": wh_a, "quantity": 100}
    )

    return {"cat_id": cat_id, "wh_a": wh_a, "wh_b": wh_b, "prod_id": prod_id}

def test_successful_stock_transfer(client, auth_headers, transfer_setup):
    prod_id = transfer_setup["prod_id"]
    wh_a = transfer_setup["wh_a"]
    wh_b = transfer_setup["wh_b"]

    res = client.post(
        "/api/v1/inventory/transfer",
        headers=auth_headers,
        json={
            "product_id": prod_id,
            "source_warehouse_id": wh_a,
            "destination_warehouse_id": wh_b,
            "quantity": 30,
            "reference_number": "TRF-TEST-001",
            "notes": "Relocating stock to Beta"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["source_warehouse"]["new_available"] == 70
    assert data["destination_warehouse"]["new_available"] == 30

    # Verify both TRANSFER_OUT and TRANSFER_IN movements exist
    mv_res = client.get(f"/api/v1/inventory/movements?product_id={prod_id}", headers=auth_headers)
    assert mv_res.status_code == 200
    mvs = mv_res.json()["items"]
    types = [m["movement_type"] for m in mvs]
    assert "TRANSFER_OUT" in types
    assert "TRANSFER_IN" in types

def test_same_warehouse_transfer_rejected(client, auth_headers, transfer_setup):
    prod_id = transfer_setup["prod_id"]
    wh_a = transfer_setup["wh_a"]

    res = client.post(
        "/api/v1/inventory/transfer",
        headers=auth_headers,
        json={
            "product_id": prod_id,
            "source_warehouse_id": wh_a,
            "destination_warehouse_id": wh_a,
            "quantity": 10
        }
    )
    assert res.status_code == 422 or res.status_code == 400

def test_insufficient_stock_transfer_rejected(client, auth_headers, transfer_setup):
    prod_id = transfer_setup["prod_id"]
    wh_a = transfer_setup["wh_a"]
    wh_b = transfer_setup["wh_b"]

    res = client.post(
        "/api/v1/inventory/transfer",
        headers=auth_headers,
        json={
            "product_id": prod_id,
            "source_warehouse_id": wh_a,
            "destination_warehouse_id": wh_b,
            "quantity": 500  # only 70 available
        }
    )
    assert res.status_code == 400
    assert "Insufficient stock" in res.json()["detail"]
