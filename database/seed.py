import os
import sys

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_path)

from app.core.security import get_password_hash
from app.database import Base, SessionLocal, engine
from app.models.audit_log import AuditLog
from app.models.category import Category
from app.models.product import Product
from app.models.user import Permission, Role, User
from app.models.warehouse import Warehouse
from app.services.inventory_service import InventoryService


def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Seeding permissions...")
        permissions_data = [
            # Authentication & Security Permissions
            ("AUTH_LOGIN", "User Login Permission", "AUTH"),
            ("AUTH_REGISTER", "User Registration Permission", "AUTH"),
            ("USER_CREATE", "Create System User", "USERS"),
            ("USER_READ", "Read System Users", "USERS"),
            ("USER_UPDATE", "Update System User", "USERS"),
            ("USER_DELETE", "Delete System User", "USERS"),
            ("ROLE_CREATE", "Create System Role", "ROLES"),
            ("ROLE_READ", "Read System Roles", "ROLES"),
            ("ROLE_UPDATE", "Update System Role", "ROLES"),
            ("ROLE_DELETE", "Delete System Role", "ROLES"),
            # Inventory Subsystem Permissions
            ("inventory.view", "View Inventory Subsystem", "INVENTORY"),
            ("inventory.product.create", "Create Product", "INVENTORY"),
            ("inventory.product.update", "Update Product", "INVENTORY"),
            ("inventory.product.delete", "Delete Product", "INVENTORY"),
            ("inventory.category.create", "Create Category", "INVENTORY"),
            ("inventory.category.update", "Update Category", "INVENTORY"),
            ("inventory.category.delete", "Delete Category", "INVENTORY"),
            ("inventory.warehouse.create", "Create Warehouse", "INVENTORY"),
            ("inventory.warehouse.update", "Update Warehouse", "INVENTORY"),
            ("inventory.warehouse.delete", "Delete Warehouse", "INVENTORY"),
            ("inventory.stock.in", "Perform Stock In", "INVENTORY"),
            ("inventory.stock.out", "Perform Stock Out", "INVENTORY"),
            ("inventory.stock.adjust", "Perform Stock Adjustment", "INVENTORY"),
            ("inventory.stock.transfer", "Perform Stock Transfer", "INVENTORY"),
        ]

        perm_dict = {}
        for code, name, module in permissions_data:
            p = db.query(Permission).filter(Permission.code == code).first()
            if not p:
                p = Permission(code=code, name=name, module=module)
                db.add(p)
                db.flush()
            perm_dict[code] = p

        print("Seeding roles...")
        # 1. ADMIN
        admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
        if not admin_role:
            admin_role = Role(name="ADMIN", description="Super Administrator with unrestricted access")
            admin_role.permissions = list(perm_dict.values())
            db.add(admin_role)
            db.flush()

        # 2. MANAGER (Operational access including full inventory)
        manager_role = db.query(Role).filter(Role.name == "MANAGER").first()
        if not manager_role:
            manager_role = Role(name="MANAGER", description="Operational Manager with full Inventory authority")
            manager_role.permissions = [
                p for code, p in perm_dict.items()
                if code.startswith("inventory.") or code in ("AUTH_LOGIN", "USER_READ", "ROLE_READ")
            ]
            db.add(manager_role)
            db.flush()

        # 3. EMPLOYEE (Standard staff access)
        employee_role = db.query(Role).filter(Role.name == "EMPLOYEE").first()
        if not employee_role:
            employee_role = Role(name="EMPLOYEE", description="Standard Enterprise Employee")
            employee_role.permissions = [
                p for code, p in perm_dict.items()
                if code in ("AUTH_LOGIN", "inventory.view")
            ]
            db.add(employee_role)
            db.flush()

        print("Seeding users...")
        # Admin user
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_pwd = os.getenv("DEFAULT_ADMIN_PASSWORD", "Admin@123")
            admin_user = User(
                email="admin@smarterp.com",
                username="admin",
                full_name="System Administrator",
                hashed_password=get_password_hash(admin_pwd),
                is_active=True,
                is_superuser=True,
                roles=[admin_role]
            )
            db.add(admin_user)
            db.flush()

            # Audit log for seed
            audit = AuditLog(
                user_id=admin_user.id,
                action="SYSTEM_INIT",
                description="Database seeded with default Administrator account.",
                ip_address="127.0.0.1"
            )
            db.add(audit)
        elif admin_user.email.endswith(".local"):
            admin_user.email = "admin@smarterp.com"

        # Inventory Manager user
        inv_user = db.query(User).filter(User.username == "inventory_manager").first()
        if not inv_user:
            inv_user = User(
                email="inventory@smarterp.com",
                username="inventory_manager",
                full_name="Marcus Vance",
                hashed_password=get_password_hash("Inventory@123"),
                is_active=True,
                is_superuser=False,
                roles=[manager_role]
            )
            db.add(inv_user)
            db.flush()
        elif inv_user.email.endswith(".local"):
            inv_user.email = "inventory@smarterp.com"

        print("Seeding sample inventory categories...")
        categories_sample = [
            ("CAT-ELEC", "Electronics & Hardware", "Computer hardware, peripherals, and electronics"),
            ("CAT-OFFICE", "Office Supplies", "Stationery, paper, desk organizers, and toner"),
            ("CAT-PACK", "Packaging & Materials", "Carton boxes, bubble wraps, and taping equipment"),
            ("CAT-RAW", "Raw Materials", "Components, metal sheets, and assembly parts"),
        ]
        cat_map = {}
        for code, name, desc in categories_sample:
            cat = db.query(Category).filter(Category.category_code == code).first()
            if not cat:
                cat = Category(category_code=code, category_name=name, description=desc, is_active=True)
                db.add(cat)
                db.flush()
            cat_map[code] = cat

        print("Seeding sample warehouses...")
        warehouses_sample = [
            ("WH-MAIN", "Central Distribution Center", "Primary enterprise logistics and receiving center", "100 Logistics Blvd", "Chicago", "IL", "60601", "David Sterling", "+1-312-555-0100", "dsterling@smarterp.com"),
            ("WH-EAST", "East Coast Depot", "Regional fulfillment warehouse for Eastern region", "45 Harbor Road", "Boston", "MA", "02108", "Elena Rostova", "+1-617-555-0144", "erostova@smarterp.com"),
            ("WH-WEST", "West Regional Hub", "High-capacity storage and distribution facility", "88 Pacific Coast Hwy", "Los Angeles", "CA", "90001", "Carlos Mendez", "+1-213-555-0188", "cmendez@smarterp.com"),
        ]
        wh_map = {}
        for code, name, desc, addr, city, state, zip_c, contact, phone, email in warehouses_sample:
            wh = db.query(Warehouse).filter(Warehouse.warehouse_code == code).first()
            if not wh:
                wh = Warehouse(
                    warehouse_code=code,
                    warehouse_name=name,
                    description=desc,
                    address=addr,
                    city=city,
                    state=state,
                    postal_code=zip_c,
                    contact_person=contact,
                    phone=phone,
                    email=email,
                    is_active=True
                )
                db.add(wh)
                db.flush()
            wh_map[code] = wh

        print("Seeding sample products...")
        products_sample = [
            ("PRD-LPT-01", "SKU-LAP-PRO-15", "890100100001", "Enterprise Laptop Pro 15", "15.6-inch Core i7 32GB RAM 1TB SSD", "CAT-ELEC", "pcs", 750.00, 1199.99, 18.00, 10, 5, 100),
            ("PRD-MON-02", "SKU-MON-4K-27", "890100100002", "UltraWide 4K Monitor 27-inch", "IPS Color-calibrated UHD monitor", "CAT-ELEC", "pcs", 280.00, 449.99, 18.00, 8, 3, 50),
            ("PRD-MOU-03", "SKU-MOU-WL-ERG", "890100100003", "Ergonomic Wireless Mouse", "Dual-mode Bluetooth & 2.4GHz optical mouse", "CAT-ELEC", "pcs", 18.50, 39.99, 12.00, 25, 10, 300),
            ("PRD-KBD-04", "SKU-KBD-MEC-RGB", "890100100004", "Tactile Mechanical Keyboard", "Cherry MX Brown switches with RGB backlight", "CAT-ELEC", "pcs", 45.00, 89.99, 12.00, 15, 5, 150),
            ("PRD-PPR-05", "SKU-PPR-A4-500", "890100100005", "A4 Multipurpose Copy Paper (Ream)", "80 GSM 500 sheets premium bright white", "CAT-OFFICE", "box", 4.20, 7.99, 5.00, 50, 20, 500),
            ("PRD-BOX-06", "SKU-BOX-COR-MD", "890100100006", "Corrugated Shipping Box (Medium)", "3-ply reinforced shipping carton 12x10x8", "CAT-PACK", "pcs", 0.85, 1.99, 5.00, 100, 30, 2000),
        ]

        for p_code, sku, bar, name, desc, cat_code, unit, cost, sell, tax, reorder, min_s, max_s in products_sample:
            prod = db.query(Product).filter(Product.product_code == p_code).first()
            if not prod:
                prod = Product(
                    product_code=p_code,
                    sku=sku,
                    barcode=bar,
                    product_name=name,
                    description=desc,
                    category_id=cat_map[cat_code].id,
                    unit=unit,
                    cost_price=cost,
                    selling_price=sell,
                    tax_percentage=tax,
                    reorder_level=reorder,
                    minimum_stock_level=min_s,
                    maximum_stock_level=max_s,
                    is_active=True,
                    created_by=admin_user.id
                )
                db.add(prod)
                db.flush()

                # Add initial stock
                InventoryService.stock_in(
                    db=db,
                    product_id=prod.id,
                    warehouse_id=wh_map["WH-MAIN"].id,
                    quantity=reorder * 3,
                    reference_type="PURCHASE",
                    reference_number="PO-INIT-001",
                    notes="Initial inventory balance setup",
                    user_id=admin_user.id
                )

        db.commit()
        print("SmartERP database seed completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
