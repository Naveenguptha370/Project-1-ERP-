import pytest


@pytest.fixture
def inventory_setup(client, auth_headers):
    # Create category
    cat_res = client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"category_code": "CAT-STK", "category_name": "Stock Category"}
    )
    cat_id = cat_res.json()["id"]

    # Create warehouse
    wh_res = client.post(
        "/api/v1/warehouses",
        headers=auth_headers,
        json={"warehouse_code": "WH-STK-1", "warehouse_name": "Stock Test Warehouse 1"}
    )
    wh_id = wh_res.json()["id"]

    # Create product
    prod_res = client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={
            "product_code": "PRD-STK-01",
            "sku": "SKU-STK-01",
            "product_name": "Stock Transaction Product",
            "category_id": cat_id,
            "cost_price": 50.00,
            "selling_price": 100.00,
            "reorder_level": 10
        }
    )
    prod_id = prod_res.json()["id"]

    return {"cat_id": cat_id, "wh_id": wh_id, "prod_id": prod_id}

def test_stock_in_workflow(client, auth_headers, inventory_setup):
    prod_id = inventory_setup["prod_id"]
    wh_id = inventory_setup["wh_id"]

    # Initial Stock In
    res = client.post(
        "/api/v1/inventory/stock-in",
        headers=auth_headers,
        json={
            "product_id": prod_id,
            "warehouse_id": wh_id,
            "quantity": 100,
            "reference_type": "PURCHASE",
            "reference_number": "PO-1001",
            "notes": "Initial delivery from vendor"
        }
    )
    assert res.status_code == 201
    data = res.json()
    assert data["quantity_on_hand"] == 100
    assert data["available_quantity"] == 100
    assert data["stock_status"] == "IN STOCK"

    # Verify movement record created
    mv_res = client.get(f"/api/v1/inventory/movements?product_id={prod_id}", headers=auth_headers)
    assert mv_res.status_code == 200
    movements = mv_res.json()["items"]
    assert len(movements) >= 1
    assert movements[0]["movement_type"] == "STOCK_IN"
    assert movements[0]["quantity"] == 100
    assert movements[0]["quantity_before"] == 0
    assert movements[0]["quantity_after"] == 100

def test_stock_out_workflow(client, auth_headers, inventory_setup):
    prod_id = inventory_setup["prod_id"]
    wh_id = inventory_setup["wh_id"]

    # Stock in 50
    client.post(
        "/api/v1/inventory/stock-in",
        headers=auth_headers,
        json={"product_id": prod_id, "warehouse_id": wh_id, "quantity": 50}
    )

    # Stock out 20
    res = client.post(
        "/api/v1/inventory/stock-out",
        headers=auth_headers,
        json={
            "product_id": prod_id,
            "warehouse_id": wh_id,
            "quantity": 20,
            "reference_type": "DISPATCH",
            "reference_number": "DISP-501"
        }
    )
    assert res.status_code == 200
    assert res.json()["quantity_on_hand"] == 30
    assert res.json()["available_quantity"] >= 0

def test_insufficient_stock_rejection(client, auth_headers, inventory_setup):
    prod_id = inventory_setup["prod_id"]
    wh_id = inventory_setup["wh_id"]

    # Current available is known
    # Try removing an impossible amount (e.g. 99999 units)
    res = client.post(
        "/api/v1/inventory/stock-out",
        headers=auth_headers,
        json={
            "product_id": prod_id,
            "warehouse_id": wh_id,
            "quantity": 99999
        }
    )
    assert res.status_code == 400
    assert "Insufficient stock" in res.json()["detail"]

def test_stock_adjustment_increase_and_decrease(client, auth_headers, inventory_setup):
    prod_id = inventory_setup["prod_id"]
    wh_id = inventory_setup["wh_id"]

    # Stock adjustment INCREASE
    res_inc = client.post(
        "/api/v1/inventory/adjust",
        headers=auth_headers,
        json={
            "product_id": prod_id,
            "warehouse_id": wh_id,
            "adjustment_type": "INCREASE",
            "quantity": 15,
            "reason": "Physical Count Correction",
            "notes": "Found extra box during audit"
        }
    )
    assert res_inc.status_code == 200
    qty_after_inc = res_inc.json()["quantity_on_hand"]

    # Stock adjustment DECREASE
    res_dec = client.post(
        "/api/v1/inventory/adjust",
        headers=auth_headers,
        json={
            "product_id": prod_id,
            "warehouse_id": wh_id,
            "adjustment_type": "DECREASE",
            "quantity": 5,
            "reason": "Damaged Goods",
            "notes": "Water leakage in aisle 3"
        }
    )
    assert res_dec.status_code == 200
    assert res_dec.json()["quantity_on_hand"] == qty_after_inc - 5
