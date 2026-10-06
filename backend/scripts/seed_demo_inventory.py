"""Add a small, clearly labelled inventory sample to the configured SQLite database."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app.database.base  # noqa: F401 - register every ORM model
from app.database import Base, SessionLocal, engine
from app.database.legacy_compat import upgrade_legacy_sqlite_schema
from app.models.category import Category
from app.models.inventory import WarehouseStock
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.models.warehouse import Warehouse


SAMPLE_PRODUCTS = [
    {
        "code": "DEMO-PRD-LAPTOP",
        "sku": "DEMO-LAPTOP-01",
        "name": "Demo Business Laptop",
        "category": "DEMO-ELECTRONICS",
        "quantity": 18,
        "reorder_level": 5,
        "cost": 52000,
        "price": 64999,
    },
    {
        "code": "DEMO-PRD-MONITOR",
        "sku": "DEMO-MONITOR-01",
        "name": "Demo 24-inch Monitor",
        "category": "DEMO-ELECTRONICS",
        "quantity": 12,
        "reorder_level": 4,
        "cost": 9800,
        "price": 13999,
    },
    {
        "code": "DEMO-PRD-KEYBOARD",
        "sku": "DEMO-KEYBOARD-01",
        "name": "Demo Wireless Keyboard",
        "category": "DEMO-PERIPHERALS",
        "quantity": 3,
        "reorder_level": 8,
        "cost": 1200,
        "price": 1999,
    },
    {
        "code": "DEMO-PRD-MOUSE",
        "sku": "DEMO-MOUSE-01",
        "name": "Demo Wireless Mouse",
        "category": "DEMO-PERIPHERALS",
        "quantity": 30,
        "reorder_level": 10,
        "cost": 650,
        "price": 1199,
    },
    {
        "code": "DEMO-PRD-DOCK",
        "sku": "DEMO-DOCK-01",
        "name": "Demo USB-C Docking Station",
        "category": "DEMO-PERIPHERALS",
        "quantity": 7,
        "reorder_level": 5,
        "cost": 4200,
        "price": 6999,
    },
]


def main() -> None:
    upgrade_legacy_sqlite_schema(engine)
    Base.metadata.create_all(bind=engine)
    added_products = 0
    added_movements = 0

    with SessionLocal() as db:
        categories = {}
        for code, name in (
            ("DEMO-ELECTRONICS", "Demo Electronics"),
            ("DEMO-PERIPHERALS", "Demo Peripherals"),
        ):
            category = db.query(Category).filter(Category.category_code == code).first()
            if category is None:
                category = Category(
                    category_code=code,
                    category_name=name,
                    description="Sample data for exploring SmartERP. Safe to delete.",
                )
                db.add(category)
                db.flush()
            categories[code] = category

        warehouse = db.query(Warehouse).filter(
            Warehouse.warehouse_code == "DEMO-MAIN"
        ).first()
        if warehouse is None:
            warehouse = Warehouse(
                warehouse_code="DEMO-MAIN",
                warehouse_name="Demo Main Warehouse",
                description="Sample warehouse for exploring SmartERP.",
                city="Demo City",
                state="Demo State",
                is_active=True,
            )
            db.add(warehouse)
            db.flush()

        actor = db.query(User).filter(User.username == "admin").first()

        for sample in SAMPLE_PRODUCTS:
            product = db.query(Product).filter(Product.sku == sample["sku"]).first()
            if product is None:
                product = Product(
                    product_code=sample["code"],
                    sku=sample["sku"],
                    product_name=sample["name"],
                    description="Clearly labelled sample item. Replace with your real product data.",
                    category_id=categories[sample["category"]].id,
                    unit="pcs",
                    cost_price=sample["cost"],
                    selling_price=sample["price"],
                    tax_percentage=18,
                    reorder_level=sample["reorder_level"],
                    minimum_stock_level=max(1, sample["reorder_level"] // 2),
                    maximum_stock_level=500,
                    is_active=True,
                    created_by=actor.id if actor else None,
                )
                db.add(product)
                db.flush()
                added_products += 1

            reference = f"DEMO-OPENING-{sample['sku']}"
            existing_movement = db.query(StockMovement).filter(
                StockMovement.reference_type == "DEMO_SEED",
                StockMovement.reference_id == reference,
            ).first()
            if existing_movement:
                continue

            stock = db.query(WarehouseStock).filter(
                WarehouseStock.product_id == product.id,
                WarehouseStock.warehouse_id == warehouse.id,
            ).first()
            if stock is None:
                stock = WarehouseStock(
                    product_id=product.id,
                    warehouse_id=warehouse.id,
                    quantity_on_hand=0,
                    reserved_quantity=0,
                    available_quantity=0,
                    reorder_level=sample["reorder_level"],
                )
                db.add(stock)
                db.flush()
            before = stock.quantity_on_hand
            stock.quantity_on_hand += sample["quantity"]
            stock.reorder_level = sample["reorder_level"]
            stock.sync_available()
            db.add(
                StockMovement(
                    product_id=product.id,
                    warehouse_id=warehouse.id,
                    movement_type="STOCK_IN",
                    quantity=sample["quantity"],
                    quantity_before=before,
                    quantity_after=stock.quantity_on_hand,
                    reference_type="DEMO_SEED",
                    reference_id=reference,
                    notes="Sample opening stock. Seeded by seed_demo_inventory.py.",
                    created_by=actor.id if actor else None,
                )
            )
            added_movements += 1

        db.commit()
        product_count = db.query(Product).filter(Product.sku.like("DEMO-%")).count()
        movement_count = db.query(StockMovement).filter(
            StockMovement.reference_type == "DEMO_SEED"
        ).count()
        print(
            "Demo inventory ready: "
            f"{product_count} products, "
            f"{db.query(Category).filter(Category.category_code.like('DEMO-%')).count()} categories, "
            f"1 warehouse, {movement_count} opening stock movements. "
            f"Added this run: {added_products} products and {added_movements} movements."
        )


if __name__ == "__main__":
    main()
