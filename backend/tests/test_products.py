import pytest


@pytest.fixture
def test_category(client, auth_headers):
    res = client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"category_code": "CAT-TEST-PRD", "category_name": "Test Category PRD"}
    )
    return res.json()

def test_create_valid_product(client, auth_headers, test_category):
    response = client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={
            "product_code": "PRD-LAPTOP-01",
            "sku": "SKU-LAP-001",
            "barcode": "8901234567890",
            "product_name": "Enterprise Laptop 15",
            "description": "High performance quad-core laptop",
            "category_id": test_category["id"],
            "unit": "pcs",
            "cost_price": 650.00,
            "selling_price": 999.99,
            "tax_percentage": 18.00,
            "reorder_level": 5,
            "minimum_stock_level": 2,
            "maximum_stock_level": 50,
            "is_active": True
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["product_code"] == "PRD-LAPTOP-01"
    assert data["sku"] == "SKU-LAP-001"
    assert data["category_name"] == "Test Category PRD"
    assert data["total_stock"] == 0
    assert data["stock_status"] == "OUT OF STOCK"

def test_duplicate_sku_rejected(client, auth_headers, test_category):
    client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={
            "product_code": "PRD-ITEM-A",
            "sku": "SKU-DUP-1",
            "product_name": "Item A",
            "category_id": test_category["id"]
        }
    )
    response = client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={
            "product_code": "PRD-ITEM-B",
            "sku": "SKU-DUP-1",
            "product_name": "Item B",
            "category_id": test_category["id"]
        }
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

def test_invalid_price_rejected(client, auth_headers, test_category):
    response = client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={
            "product_code": "PRD-NEG-PRICE",
            "sku": "SKU-NEG",
            "product_name": "Negative Price Item",
            "category_id": test_category["id"],
            "cost_price": -15.00
        }
    )
    assert response.status_code == 422  # Pydantic validation error

def test_update_product(client, auth_headers, test_category):
    res = client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={
            "product_code": "PRD-UPD-01",
            "sku": "SKU-UPD-01",
            "product_name": "Before Update",
            "category_id": test_category["id"],
            "cost_price": 100.0,
            "selling_price": 150.0
        }
    )
    prod_id = res.json()["id"]

    response = client.put(
        f"/api/v1/products/{prod_id}",
        headers=auth_headers,
        json={
            "product_name": "After Update",
            "selling_price": 175.0
        }
    )
    assert response.status_code == 200
    assert response.json()["product_name"] == "After Update"
    assert float(response.json()["selling_price"]) == 175.0

def test_product_search_and_filtering(client, auth_headers, test_category):
    # Create distinct products
    client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={
            "product_code": "PRD-SEARCH-MOUSE",
            "sku": "SKU-LOGI-MOUSE",
            "product_name": "Wireless Optical Mouse",
            "category_id": test_category["id"]
        }
    )
    client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={
            "product_code": "PRD-SEARCH-KB",
            "sku": "SKU-MECH-KB",
            "product_name": "Mechanical Keyboard RGB",
            "category_id": test_category["id"]
        }
    )

    # Search by keyword "Mouse"
    s_res = client.get("/api/v1/products?search=Mouse", headers=auth_headers)
    assert s_res.status_code == 200
    items = s_res.json()["items"]
    assert any("Mouse" in item["product_name"] for item in items)
    assert not any("Keyboard" in item["product_name"] for item in items)

    # Search by SKU
    sku_res = client.get("/api/v1/products?search=SKU-MECH-KB", headers=auth_headers)
    assert sku_res.status_code == 200
    assert len(sku_res.json()["items"]) == 1
    assert sku_res.json()["items"][0]["product_code"] == "PRD-SEARCH-KB"

    # Filter by category
    cat_res = client.get(f"/api/v1/products?category_id={test_category['id']}", headers=auth_headers)
    assert cat_res.status_code == 200
    assert cat_res.json()["total"] >= 2
