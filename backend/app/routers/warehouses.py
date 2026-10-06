
from app.database import get_db
from app.dependencies import require_permission
from app.models.inventory import WarehouseStock
from app.models.product import Product
from app.models.user import User
from app.models.warehouse import Warehouse
from app.schemas.warehouse import (
    WarehouseCreate,
    WarehouseDetailResponse,
    WarehouseListResponse,
    WarehouseResponse,
    WarehouseStockItem,
    WarehouseUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

router = APIRouter(prefix="/warehouses", tags=["Inventory — Warehouses"])

def get_warehouse_metrics(warehouse_id: int, db: Session):
    stocks = db.query(WarehouseStock).filter(WarehouseStock.warehouse_id == warehouse_id).all()
    total_products = len(stocks)
    total_units = sum(s.quantity_on_hand for s in stocks)
    low_stock_count = sum(1 for s in stocks if s.available_quantity <= s.reorder_level)
    return total_products, total_units, low_stock_count

def build_warehouse_response(warehouse: Warehouse, db: Session) -> WarehouseResponse:
    total_products, total_units, low_stock_count = get_warehouse_metrics(warehouse.id, db)
    return WarehouseResponse(
        id=warehouse.id,
        warehouse_code=warehouse.warehouse_code,
        warehouse_name=warehouse.warehouse_name,
        description=warehouse.description,
        address=warehouse.address,
        city=warehouse.city,
        state=warehouse.state,
        postal_code=warehouse.postal_code,
        contact_person=warehouse.contact_person,
        phone=warehouse.phone,
        email=warehouse.email,
        is_active=warehouse.is_active,
        total_products_count=total_products,
        total_units_in_stock=total_units,
        low_stock_products_count=low_stock_count,
        created_at=warehouse.created_at,
        updated_at=warehouse.updated_at
    )

@router.get("", response_model=WarehouseListResponse)
def get_warehouses(
    search: str | None = Query(None, description="Search by name, code, city, contact"),
    is_active: bool | None = Query(None, description="Filter active/inactive"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.view"))
):
    query = db.query(Warehouse)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (Warehouse.warehouse_name.ilike(search_fmt)) |
            (Warehouse.warehouse_code.ilike(search_fmt)) |
            (Warehouse.city.ilike(search_fmt)) |
            (Warehouse.contact_person.ilike(search_fmt))
        )

    if is_active is not None:
        query = query.filter(Warehouse.is_active == is_active)

    total = query.count()
    warehouses = query.order_by(Warehouse.warehouse_name.asc()).offset(skip).limit(limit).all()

    items = [build_warehouse_response(wh, db) for wh in warehouses]
    return WarehouseListResponse(total=total, items=items)

@router.get("/{warehouse_id}", response_model=WarehouseDetailResponse)
def get_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.view"))
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")

    total_products, total_units, low_stock_count = get_warehouse_metrics(warehouse.id, db)
    
    # Load warehouse stock items
    stock_rows = (
        db.query(WarehouseStock, Product)
        .join(Product, WarehouseStock.product_id == Product.id)
        .filter(WarehouseStock.warehouse_id == warehouse_id)
        .order_by(Product.product_name.asc())
        .all()
    )

    stock_items = []
    for inv, prod in stock_rows:
        status_str = "OUT OF STOCK" if inv.available_quantity <= 0 else (
            "LOW STOCK" if inv.available_quantity <= inv.reorder_level else "IN STOCK"
        )
        stock_items.append(WarehouseStockItem(
            product_id=prod.id,
            product_name=prod.product_name,
            product_code=prod.product_code,
            sku=prod.sku,
            unit=prod.unit,
            category_name=prod.category.category_name if prod.category else None,
            quantity_on_hand=inv.quantity_on_hand,
            reserved_quantity=inv.reserved_quantity,
            available_quantity=inv.available_quantity,
            reorder_level=inv.reorder_level,
            stock_status=status_str
        ))

    return WarehouseDetailResponse(
        id=warehouse.id,
        warehouse_code=warehouse.warehouse_code,
        warehouse_name=warehouse.warehouse_name,
        description=warehouse.description,
        address=warehouse.address,
        city=warehouse.city,
        state=warehouse.state,
        postal_code=warehouse.postal_code,
        contact_person=warehouse.contact_person,
        phone=warehouse.phone,
        email=warehouse.email,
        is_active=warehouse.is_active,
        total_products_count=total_products,
        total_units_in_stock=total_units,
        low_stock_products_count=low_stock_count,
        created_at=warehouse.created_at,
        updated_at=warehouse.updated_at,
        stock_items=stock_items
    )

@router.post("", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse(
    payload: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.warehouse.create"))
):
    if db.query(Warehouse).filter(Warehouse.warehouse_code == payload.warehouse_code).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Warehouse with code '{payload.warehouse_code}' already exists"
        )

    if db.query(Warehouse).filter(func.lower(Warehouse.warehouse_name) == payload.warehouse_name.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Warehouse with name '{payload.warehouse_name}' already exists"
        )

    warehouse = Warehouse(
        warehouse_code=payload.warehouse_code,
        warehouse_name=payload.warehouse_name,
        description=payload.description,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        postal_code=payload.postal_code,
        contact_person=payload.contact_person,
        phone=payload.phone,
        email=payload.email,
        is_active=payload.is_active
    )

    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)

    return build_warehouse_response(warehouse, db)

@router.put("/{warehouse_id}", response_model=WarehouseResponse)
@router.patch("/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(
    warehouse_id: int,
    payload: WarehouseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.warehouse.update"))
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")

    if payload.warehouse_code and payload.warehouse_code != warehouse.warehouse_code:
        conflict = db.query(Warehouse).filter(
            Warehouse.warehouse_code == payload.warehouse_code,
            Warehouse.id != warehouse_id
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Warehouse with code '{payload.warehouse_code}' already exists"
            )
        warehouse.warehouse_code = payload.warehouse_code

    if payload.warehouse_name and payload.warehouse_name != warehouse.warehouse_name:
        conflict = db.query(Warehouse).filter(
            func.lower(Warehouse.warehouse_name) == payload.warehouse_name.lower(),
            Warehouse.id != warehouse_id
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Warehouse with name '{payload.warehouse_name}' already exists"
            )
        warehouse.warehouse_name = payload.warehouse_name

    if payload.description is not None:
        warehouse.description = payload.description
    if payload.address is not None:
        warehouse.address = payload.address
    if payload.city is not None:
        warehouse.city = payload.city
    if payload.state is not None:
        warehouse.state = payload.state
    if payload.postal_code is not None:
        warehouse.postal_code = payload.postal_code
    if payload.contact_person is not None:
        warehouse.contact_person = payload.contact_person
    if payload.phone is not None:
        warehouse.phone = payload.phone
    if payload.email is not None:
        warehouse.email = payload.email
    if payload.is_active is not None:
        warehouse.is_active = payload.is_active

    db.commit()
    db.refresh(warehouse)

    return build_warehouse_response(warehouse, db)

@router.delete("/{warehouse_id}", status_code=status.HTTP_200_OK)
def delete_warehouse(
    warehouse_id: int,
    force_deactivate: bool = Query(False, description="Safely deactivate warehouse instead of deletion"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.warehouse.delete"))
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")

    # Safe deletion check: does this warehouse have units in stock?
    total_products, total_units, _ = get_warehouse_metrics(warehouse_id, db)
    if total_units > 0:
        if force_deactivate:
            warehouse.is_active = False
            db.commit()
            return {
                "message": f"Warehouse holds {total_units} units across {total_products} products and has been safely deactivated.",
                "action": "deactivated",
                "id": warehouse_id
            }
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Warehouse cannot be deleted because it currently holds {total_units} units of stock. Transfer or remove stock first, or deactivate the warehouse."
        )

    db.delete(warehouse)
    db.commit()
    return {"message": "Warehouse deleted successfully", "action": "deleted", "id": warehouse_id}
