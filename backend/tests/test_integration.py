from decimal import Decimal

from app.services.inventory_service import InventoryService


def test_sales_deduct_stock_integration(db):
    # Setup test category, warehouse, product
    from app.models.category import Category
    from app.models.product import Product
    from app.models.warehouse import Warehouse

    cat = Category(category_code="CAT-INT-S", category_name="Sales Int Cat")
    db.add(cat)
    wh = Warehouse(warehouse_code="WH-INT-S", warehouse_name="Sales Int WH")
    db.add(wh)
    db.flush()

    prod = Product(
        product_code="PRD-SALES-INT",
        sku="SKU-SALES-INT",
        product_name="Product for Sales Order",
        category_id=cat.id,
        cost_price=Decimal("40.00"),
        selling_price=Decimal("90.00")
    )
    db.add(prod)
    db.flush()

    # Purchase initial stock (100 units)
    InventoryService.add_stock(
        db=db,
        product_id=prod.id,
        warehouse_id=wh.id,
        quantity=100,
        reference_id="PO-INT-999",
        notes="Procurement receipt"
    )

    stock = InventoryService.get_or_create_stock(db, prod.id, wh.id)
    assert stock.available_quantity == 100

    # Sales subsystem integration: deduct 25 units for Invoice #INV-8888
    mv = InventoryService.deduct_stock(
        db=db,
        product_id=prod.id,
        warehouse_id=wh.id,
        quantity=25,
        reference_id="INV-8888",
        notes="Sales invoice confirmed delivery"
    )
    assert mv.movement_type == "SALE"
    assert mv.quantity == 25
    assert mv.quantity_after == 75

    db.refresh(stock)
    assert stock.available_quantity == 75

def test_dashboard_inventory_summary_valuation(db):
    summary = InventoryService.get_inventory_summary(db)
    assert "total_products" in summary
    assert "total_categories" in summary
    assert "total_warehouses" in summary
    assert "total_units_in_stock" in summary
    assert "inventory_valuation" in summary
    assert summary["inventory_valuation"] >= 0
