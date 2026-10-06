# SmartERP — Inventory Management Subsystem

## 1. Overview & Architecture

SmartERP is an enterprise-grade ERP system built with a modular subsystem architecture. 
The **Inventory Management Subsystem** provides:

1. **Products Catalog**
2. **Categories Management**
3. **Warehouses & Facilities**
4. **Stock Operations & Concurrency Engine**

All data is persistently managed through PostgreSQL using SQLAlchemy 2.0 and validated with Pydantic v2 schemas. Every button, CRUD operation, stock update, and transaction is fully implemented without placeholders or mock data.

---

## 2. Architectural Structure

```
Inventory Subsystem
│
├── Overview (Dashboard KPIs, Valuation, Recharts Analytics)
│
├── Products
│   ├── Product List (Table, Search, Category/Stock Filters, Pagination)
│   ├── Add Product Modal (Validation: unique SKU/code, non-negative prices, reorder thresholds)
│   ├── Edit Product Modal
│   ├── Product Details Modal (General info, pricing, warehouse-wise stock table)
│   └── Safe Deletion (Deactivation fallback when stock or movements exist)
│
├── Categories
│   ├── Category List (Table, Search, Products count)
│   ├── Add / Edit Category
│   └── Safe Deletion (Restricted if assigned to products)
│
├── Warehouses
│   ├── Warehouse List (Table, Search, Units in stock, Low stock count)
│   ├── Add / Edit Warehouse
│   ├── Warehouse Stock Breakdown Modal
│   └── Deletion Protection (Restricted if holding physical units)
│
└── Stock & Transactions Engine
    ├── Stock Overview (Product + Warehouse matrix)
    ├── Stock In (Receive items, update on-hand, log STOCK_IN)
    ├── Stock Out (Dispatch items, validate sufficient stock, prevent negative quantity, log STOCK_OUT)
    ├── Stock Adjustment (Increase/Decrease with mandatory audit reason)
    ├── Stock Transfer (Multi-warehouse atomic relocation with rollback safety)
    ├── Low Stock Monitoring (Real-time threshold detection: available <= reorder_level)
    └── Stock Movement History (Immutable audit trail of all transactions)
```

---

## 3. Database Schema & Models

### `categories`
- `id` (PK, Integer)
- `category_code` (VARCHAR 50, UNIQUE, Indexed)
- `category_name` (VARCHAR 100, UNIQUE, Indexed)
- `description` (TEXT)
- `parent_category_id` (FK to categories.id, nullable)
- `is_active` (BOOLEAN, default True)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### `products`
- `id` (PK, Integer)
- `product_code` (VARCHAR 50, UNIQUE, Indexed)
- `sku` (VARCHAR 50, UNIQUE, Indexed)
- `barcode` (VARCHAR 100, UNIQUE, Indexed)
- `product_name` (VARCHAR 150, Indexed)
- `description` (TEXT)
- `category_id` (FK to categories.id ON DELETE RESTRICT)
- `unit` (VARCHAR 30, e.g. "pcs", "kg", "box")
- `cost_price` (NUMERIC 12,2 >= 0)
- `selling_price` (NUMERIC 12,2 >= 0)
- `tax_percentage` (NUMERIC 5,2 between 0 and 100)
- `reorder_level` (INTEGER >= 0)
- `minimum_stock_level` (INTEGER >= 0)
- `maximum_stock_level` (INTEGER >= 0)
- `is_active` (BOOLEAN, default True)
- `created_by` (FK to users.id)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### `warehouses`
- `id` (PK, Integer)
- `warehouse_code` (VARCHAR 50, UNIQUE, Indexed)
- `warehouse_name` (VARCHAR 100, UNIQUE, Indexed)
- `description` (TEXT)
- `address`, `city`, `state`, `postal_code` (VARCHAR)
- `contact_person`, `phone`, `email` (VARCHAR)
- `is_active` (BOOLEAN, default True)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### `inventory` (Warehouse Stock)
- `id` (PK, Integer)
- `product_id` (FK to products.id ON DELETE CASCADE)
- `warehouse_id` (FK to warehouses.id ON DELETE CASCADE)
- `quantity_on_hand` (INTEGER, default 0)
- `reserved_quantity` (INTEGER, default 0)
- `available_quantity` (INTEGER, default 0)
- `reorder_level` (INTEGER, default 10)
- `last_updated` (TIMESTAMPTZ)
- **Constraint**: `CONSTRAINT uq_product_warehouse UNIQUE (product_id, warehouse_id)`

### `stock_movements` (Immutable Audit Ledger)
- `id` (PK, Integer)
- `product_id` (FK to products.id ON DELETE RESTRICT)
- `warehouse_id` (FK to warehouses.id ON DELETE RESTRICT)
- `movement_type` (VARCHAR 50: `STOCK_IN`, `STOCK_OUT`, `PURCHASE`, `SALE`, `TRANSFER_IN`, `TRANSFER_OUT`, `ADJUSTMENT_IN`, `ADJUSTMENT_OUT`, `RETURN_IN`, `RETURN_OUT`)
- `quantity` (INTEGER > 0)
- `quantity_before` (INTEGER)
- `quantity_after` (INTEGER)
- `source_warehouse_id` (FK to warehouses.id, nullable)
- `destination_warehouse_id` (FK to warehouses.id, nullable)
- `reference_type` (VARCHAR 50: `MANUAL`, `PURCHASE`, `SALE`, `TRANSFER`, `ADJUSTMENT`)
- `reference_id` (VARCHAR 100, e.g. PO/Invoice/Transfer number)
- `notes` (TEXT)
- `created_by` (FK to users.id)
- `created_at` (TIMESTAMPTZ, immutable)

---

## 4. REST API Specifications

| Method | Endpoint | Description | Permissions |
|---|---|---|---|
| `GET` | `/api/v1/categories` | List categories with search, active filter, pagination | `inventory.view` |
| `GET` | `/api/v1/categories/{id}` | Get category details with assigned product count | `inventory.view` |
| `POST` | `/api/v1/categories` | Create category (validates unique code & name) | `inventory.category.create` |
| `PUT` | `/api/v1/categories/{id}` | Update category | `inventory.category.update` |
| `DELETE` | `/api/v1/categories/{id}` | Safe delete (rejects if products assigned) | `inventory.category.delete` |
| `GET` | `/api/v1/products` | List products with search, category & stock status filters | `inventory.view` |
| `GET` | `/api/v1/products/{id}` | Get product details with warehouse stock breakdown | `inventory.view` |
| `POST` | `/api/v1/products` | Create product (validates unique SKU/code, non-negatives) | `inventory.product.create` |
| `PUT` | `/api/v1/products/{id}` | Update product | `inventory.product.update` |
| `DELETE` | `/api/v1/products/{id}` | Safe delete (blocks if stock/movements exist, supports deactivation) | `inventory.product.delete` |
| `GET` | `/api/v1/warehouses` | List warehouses with product count and total physical units | `inventory.view` |
| `GET` | `/api/v1/warehouses/{id}` | Warehouse details with full stock breakdown table | `inventory.view` |
| `POST` | `/api/v1/warehouses` | Register new warehouse | `inventory.warehouse.create` |
| `PUT` | `/api/v1/warehouses/{id}` | Update warehouse details | `inventory.warehouse.update` |
| `DELETE` | `/api/v1/warehouses/{id}` | Safe delete (blocks if units are held) | `inventory.warehouse.delete` |
| `GET` | `/api/v1/inventory` | Query inventory records across products and warehouses | `inventory.view` |
| `POST` | `/api/v1/inventory/stock-in` | Perform Stock In transaction | `inventory.stock.in` |
| `POST` | `/api/v1/inventory/stock-out` | Perform Stock Out transaction (rejects negative stock) | `inventory.stock.out` |
| `POST` | `/api/v1/inventory/adjust` | Perform Stock Adjustment (with reason and audit note) | `inventory.stock.adjust` |
| `POST` | `/api/v1/inventory/transfer` | Perform Stock Transfer (atomic rollback on error) | `inventory.stock.transfer` |
| `GET` | `/api/v1/inventory/movements` | Query immutable stock movement audit ledger | `inventory.view` |
| `GET` | `/api/v1/inventory/low-stock` | Real-time low stock and out-of-stock alert items | `inventory.view` |
| `GET` | `/api/v1/inventory/summary` | Real-time KPIs and total valuation ($) | `inventory.view` |

---

## 5. Concurrency & Transaction Safety

1. **Row-Level Locking**: When modifying inventory records (`stock_in`, `stock_out`, `adjust`, `transfer`), rows are locked using `.with_for_update()` in PostgreSQL to prevent race conditions and double-spending of stock.
2. **Atomic Transfers**: Transfers deduct source and increment destination in a single database transaction. If destination creation or writing fails, the entire transaction is rolled back with `db.rollback()`.
3. **No Negative Stock**: Stock deductions strictly verify `available_quantity >= requested_quantity`. If insufficient, an HTTP 400 error is thrown with: `"Insufficient stock. Only X units are available."`

---

## 6. Cross-Module Integration Hooks

### Integration with Authentication & RBAC Subsystem
- All inventory endpoints require a valid Bearer JWT.
- Granular permissions enforced: `inventory.view`, `inventory.product.*`, `inventory.category.*`, `inventory.warehouse.*`, `inventory.stock.*`.
- Actions record the operating `user_id` in `StockMovement.created_by`.

### Integration with Sales Management Subsystem
When a Sales Order is confirmed and delivered:
```python
from app.services.inventory_service import InventoryService

# Deduct stock upon sales confirmation
movement = InventoryService.deduct_stock(
    db=db,
    product_id=product_id,
    warehouse_id=warehouse_id,
    quantity=ordered_qty,
    reference_id=invoice_number,
    notes="Sales Order Delivery",
    user_id=current_user.id
)
```

### Integration with Procurement & Finance Subsystem
When a Purchase Order shipment arrives:
```python
from app.services.inventory_service import InventoryService

# Increase stock upon goods receipt
movement = InventoryService.add_stock(
    db=db,
    product_id=product_id,
    warehouse_id=warehouse_id,
    quantity=received_qty,
    reference_id=purchase_order_number,
    notes="Goods Receipt Note #GRN-101",
    user_id=current_user.id
)
```

### Integration with Dashboard & Reports Subsystem
Provides live summary metrics and financial valuation:
```python
from app.services.inventory_service import InventoryService

# Get inventory KPIs and valuation
summary = InventoryService.get_inventory_summary(db)
# Valuation formula: SUM(current_stock * cost_price)
total_valuation = summary["inventory_valuation"]
```
