def test_low_stock_and_out_of_stock_detection(client, auth_headers):
    # Category
    cat_id = client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"category_code": "CAT-ALERT", "category_name": "Alert Category"}
    ).json()["id"]

    # Warehouse
    wh_id = client.post(
        "/api/v1/warehouses",
        headers=auth_headers,
        json={"warehouse_code": "WH-ALERT", "warehouse_name": "Alert Warehouse"}
    ).json()["id"]

    # Product with reorder_level = 20
    prod_id = client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={
            "product_code": "PRD-LOW-01",
            "sku": "SKU-LOW-01",
            "product_name": "Low Stock Monitored Item",
            "category_id": cat_id,
            "reorder_level": 20
        }
    ).json()["id"]

    # Stock in only 5 units (5 <= 20 => LOW STOCK, shortage = 15)
    client.post(
        "/api/v1/inventory/stock-in",
        headers=auth_headers,
        json={"product_id": prod_id, "warehouse_id": wh_id, "quantity": 5}
    )

    # Check /api/v1/inventory/low-stock
    res = client.get(f"/api/v1/inventory/low-stock?warehouse_id={wh_id}", headers=auth_headers)
    assert res.status_code == 200
    alerts = res.json()
    assert len(alerts) >= 1
    target = next((item for item in alerts if item["product_id"] == prod_id), None)
    assert target is not None
    assert target["available_quantity"] == 5
    assert target["reorder_level"] == 20
    assert target["shortage"] == 15
    assert target["stock_status"] == "LOW STOCK"

    # Stock out all 5 units => OUT OF STOCK
    client.post(
        "/api/v1/inventory/stock-out",
        headers=auth_headers,
        json={"product_id": prod_id, "warehouse_id": wh_id, "quantity": 5}
    )

    res2 = client.get(f"/api/v1/inventory/low-stock?warehouse_id={wh_id}", headers=auth_headers)
    assert res2.status_code == 200
    target2 = next((item for item in res2.json() if item["product_id"] == prod_id), None)
    assert target2 is not None
    assert target2["available_quantity"] == 0
    assert target2["stock_status"] == "OUT OF STOCK"
    assert target2["shortage"] == 20
