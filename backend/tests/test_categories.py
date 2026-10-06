def test_create_category(client, auth_headers):
    response = client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={
            "category_code": "CAT-ELEC",
            "category_name": "Electronics",
            "description": "Electronic gadgets and components",
            "is_active": True
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["category_code"] == "CAT-ELEC"
    assert data["category_name"] == "Electronics"
    assert data["product_count"] == 0

def test_duplicate_category_code_rejected(client, auth_headers):
    client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"category_code": "CAT-FURN", "category_name": "Furniture"}
    )
    # Attempt duplicate code
    response = client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"category_code": "CAT-FURN", "category_name": "Different Name"}
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

def test_duplicate_category_name_rejected(client, auth_headers):
    client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"category_code": "CAT-TOOL1", "category_name": "Tools"}
    )
    # Attempt duplicate name with different code
    response = client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"category_code": "CAT-TOOL2", "category_name": "Tools"}
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

def test_update_category(client, auth_headers):
    cat_res = client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"category_code": "CAT-AUTO", "category_name": "Automotive"}
    )
    cat_id = cat_res.json()["id"]

    response = client.put(
        f"/api/v1/categories/{cat_id}",
        headers=auth_headers,
        json={"category_name": "Automotive Parts & Supplies"}
    )
    assert response.status_code == 200
    assert response.json()["category_name"] == "Automotive Parts & Supplies"

def test_delete_empty_category(client, auth_headers):
    cat_res = client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"category_code": "CAT-TEMP", "category_name": "Temporary"}
    )
    cat_id = cat_res.json()["id"]

    del_res = client.delete(f"/api/v1/categories/{cat_id}", headers=auth_headers)
    assert del_res.status_code == 200
    assert del_res.json()["action"] == "deleted"

def test_delete_category_with_products_prevented(client, auth_headers):
    cat_res = client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"category_code": "CAT-PROTECT", "category_name": "Protected Category"}
    )
    cat_id = cat_res.json()["id"]

    # Add a product to this category
    client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={
            "product_code": "PRD-PROT1",
            "sku": "SKU-PROT1",
            "product_name": "Protected Item",
            "category_id": cat_id,
            "unit": "pcs",
            "cost_price": 50.0,
            "selling_price": 80.0
        }
    )

    # Attempt to delete category
    del_res = client.delete(f"/api/v1/categories/{cat_id}", headers=auth_headers)
    assert del_res.status_code == 400
    assert "Category cannot be deleted because products are assigned to it." in del_res.json()["detail"]

    # Deactivate safely
    deact_res = client.delete(f"/api/v1/categories/{cat_id}?deactivate_if_has_products=true", headers=auth_headers)
    assert deact_res.status_code == 200
    assert deact_res.json()["action"] == "deactivated"
