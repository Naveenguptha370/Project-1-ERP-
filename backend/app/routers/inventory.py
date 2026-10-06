
from app.database import get_db
from app.dependencies import require_permission
from app.models.inventory import WarehouseStock
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.models.warehouse import Warehouse
from app.schemas.inventory import (
    InventoryItemResponse,
    InventoryListResponse,
    InventorySummaryResponse,
    LowStockItemResponse,
    StockAdjustmentRequest,
    StockInRequest,
    StockMovementListResponse,
    StockMovementResponse,
    StockOutRequest,
    StockTransferRequest,
)
from app.services.inventory_service import InventoryService
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/inventory", tags=["Inventory — Stock & Operations"])

def build_inventory_item_response(inv: WarehouseStock, prod: Product, wh: Warehouse) -> InventoryItemResponse:
    if inv.available_quantity <= 0:
        status_str = "OUT OF STOCK"
    elif inv.available_quantity <= inv.reorder_level:
        status_str = "LOW STOCK"
    else:
        status_str = "IN STOCK"

    return InventoryItemResponse(
        id=inv.id,
        product_id=prod.id,
        product_name=prod.product_name,
        product_code=prod.product_code,
        sku=prod.sku,
        category_id=prod.category_id,
        category_name=prod.category.category_name if prod.category else None,
        warehouse_id=wh.id,
        warehouse_name=wh.warehouse_name,
        warehouse_code=wh.warehouse_code,
        quantity_on_hand=inv.quantity_on_hand,
        reserved_quantity=inv.reserved_quantity,
        available_quantity=inv.available_quantity,
        reorder_level=inv.reorder_level,
        stock_status=status_str,
        last_updated=inv.last_updated
    )

def build_movement_response(mv: StockMovement) -> StockMovementResponse:
    return StockMovementResponse(
        id=mv.id,
        product_id=mv.product_id,
        product_name=mv.product.product_name if mv.product else f"Product #{mv.product_id}",
        product_code=mv.product.product_code if mv.product else f"PRD-{mv.product_id}",
        sku=mv.product.sku if mv.product else "",
        warehouse_id=mv.warehouse_id,
        warehouse_name=mv.warehouse.warehouse_name if mv.warehouse else f"Warehouse #{mv.warehouse_id}",
        movement_type=mv.movement_type,
        quantity=mv.quantity,
        quantity_before=mv.quantity_before,
        quantity_after=mv.quantity_after,
        source_warehouse_id=mv.source_warehouse_id,
        source_warehouse_name=mv.source_warehouse.warehouse_name if mv.source_warehouse else None,
        destination_warehouse_id=mv.destination_warehouse_id,
        destination_warehouse_name=mv.destination_warehouse.warehouse_name if mv.destination_warehouse else None,
        reference_type=mv.reference_type,
        reference_id=mv.reference_id,
        notes=mv.notes,
        created_by=mv.created_by,
        creator_name=mv.creator.full_name if mv.creator else None,
        created_at=mv.created_at
    )

@router.get("", response_model=InventoryListResponse)
def get_inventory(
    search: str | None = Query(None, description="Search product name, code, SKU"),
    product_id: int | None = None,
    warehouse_id: int | None = None,
    category_id: int | None = None,
    stock_status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.view"))
):
    query = (
        db.query(WarehouseStock, Product, Warehouse)
        .join(Product, WarehouseStock.product_id == Product.id)
        .join(Warehouse, WarehouseStock.warehouse_id == Warehouse.id)
    )

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (Product.product_name.ilike(search_fmt)) |
            (Product.product_code.ilike(search_fmt)) |
            (Product.sku.ilike(search_fmt)) |
            (Warehouse.warehouse_name.ilike(search_fmt))
        )
    if product_id:
        query = query.filter(WarehouseStock.product_id == product_id)
    if warehouse_id:
        query = query.filter(WarehouseStock.warehouse_id == warehouse_id)
    if category_id:
        query = query.filter(Product.category_id == category_id)

    rows = query.order_by(Product.product_name.asc(), Warehouse.warehouse_name.asc()).all()

    items = []
    for inv, prod, wh in rows:
        resp = build_inventory_item_response(inv, prod, wh)
        if stock_status:
            status_norm = stock_status.strip().upper().replace("_", " ")
            if resp.stock_status != status_norm:
                continue
        items.append(resp)

    total = len(items)
    paginated = items[skip : skip + limit]
    return InventoryListResponse(total=total, items=paginated)

@router.get("/summary", response_model=InventorySummaryResponse)
def get_inventory_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.view"))
):
    summary_data = InventoryService.get_inventory_summary(db)
    
    # Recent 10 movements
    recent_mvs = (
        db.query(StockMovement)
        .order_by(StockMovement.created_at.desc())
        .limit(10)
        .all()
    )
    recent_formatted = [build_movement_response(m) for m in recent_mvs]

    return InventorySummaryResponse(
        total_products=summary_data["total_products"],
        total_categories=summary_data["total_categories"],
        total_warehouses=summary_data["total_warehouses"],
        total_units_in_stock=summary_data["total_units_in_stock"],
        low_stock_products_count=summary_data["low_stock_products_count"],
        out_of_stock_products_count=summary_data["out_of_stock_products_count"],
        inventory_valuation=summary_data["inventory_valuation"],
        categories_breakdown=summary_data["categories_breakdown"],
        warehouses_breakdown=summary_data["warehouses_breakdown"],
        recent_movements=recent_formatted
    )

@router.get("/low-stock", response_model=list[LowStockItemResponse])
def get_low_stock(
    warehouse_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.view"))
):
    query = (
        db.query(WarehouseStock, Product, Warehouse)
        .join(Product, WarehouseStock.product_id == Product.id)
        .join(Warehouse, WarehouseStock.warehouse_id == Warehouse.id)
        .filter(WarehouseStock.available_quantity <= WarehouseStock.reorder_level)
    )
    if warehouse_id:
        query = query.filter(WarehouseStock.warehouse_id == warehouse_id)

    rows = query.order_by(WarehouseStock.available_quantity.asc()).all()

    items = []
    for inv, prod, wh in rows:
        status_str = "OUT OF STOCK" if inv.available_quantity <= 0 else "LOW STOCK"
        shortage = max(0, inv.reorder_level - inv.available_quantity)
        items.append(LowStockItemResponse(
            product_id=prod.id,
            product_name=prod.product_name,
            product_code=prod.product_code,
            sku=prod.sku,
            category_name=prod.category.category_name if prod.category else None,
            warehouse_id=wh.id,
            warehouse_name=wh.warehouse_name,
            warehouse_code=wh.warehouse_code,
            available_quantity=inv.available_quantity,
            reorder_level=inv.reorder_level,
            shortage=shortage,
            stock_status=status_str
        ))
    return items

@router.get("/movements", response_model=StockMovementListResponse)
def get_stock_movements(
    product_id: int | None = None,
    warehouse_id: int | None = None,
    movement_type: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.view"))
):
    query = db.query(StockMovement)
    if product_id:
        query = query.filter(StockMovement.product_id == product_id)
    if warehouse_id:
        query = query.filter(StockMovement.warehouse_id == warehouse_id)
    if movement_type:
        query = query.filter(StockMovement.movement_type == movement_type.strip().upper())

    total = query.count()
    movements = query.order_by(StockMovement.created_at.desc()).offset(skip).limit(limit).all()

    return StockMovementListResponse(
        total=total,
        items=[build_movement_response(m) for m in movements]
    )

@router.post("/stock-in", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def stock_in(
    payload: StockInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.stock.in"))
):
    stock, _ = InventoryService.stock_in(
        db=db,
        product_id=payload.product_id,
        warehouse_id=payload.warehouse_id,
        quantity=payload.quantity,
        reference_type=payload.reference_type or "MANUAL",
        reference_number=payload.reference_number,
        notes=payload.notes,
        user_id=current_user.id
    )
    return build_inventory_item_response(stock, stock.product, stock.warehouse)

@router.post("/stock-out", response_model=InventoryItemResponse)
def stock_out(
    payload: StockOutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.stock.out"))
):
    stock, _ = InventoryService.stock_out(
        db=db,
        product_id=payload.product_id,
        warehouse_id=payload.warehouse_id,
        quantity=payload.quantity,
        reference_type=payload.reference_type or "MANUAL",
        reference_number=payload.reference_number,
        notes=payload.notes,
        user_id=current_user.id
    )
    return build_inventory_item_response(stock, stock.product, stock.warehouse)

@router.post("/adjust", response_model=InventoryItemResponse)
def stock_adjust(
    payload: StockAdjustmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.stock.adjust"))
):
    stock, _ = InventoryService.stock_adjust(
        db=db,
        product_id=payload.product_id,
        warehouse_id=payload.warehouse_id,
        adjustment_type=payload.adjustment_type,
        quantity=payload.quantity,
        reason=payload.reason,
        notes=payload.notes,
        user_id=current_user.id
    )
    return build_inventory_item_response(stock, stock.product, stock.warehouse)

@router.post("/transfer")
def stock_transfer(
    payload: StockTransferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.stock.transfer"))
):
    src_stock, dest_stock, mv_out, mv_in = InventoryService.transfer_stock(
        db=db,
        product_id=payload.product_id,
        source_warehouse_id=payload.source_warehouse_id,
        destination_warehouse_id=payload.destination_warehouse_id,
        quantity=payload.quantity,
        reference_number=payload.reference_number,
        notes=payload.notes,
        user_id=current_user.id
    )
    return {
        "message": f"Successfully transferred {payload.quantity} units from {src_stock.warehouse.warehouse_name} to {dest_stock.warehouse.warehouse_name}.",
        "product_id": payload.product_id,
        "product_name": src_stock.product.product_name,
        "source_warehouse": {
            "id": src_stock.warehouse_id,
            "name": src_stock.warehouse.warehouse_name,
            "new_available": src_stock.available_quantity
        },
        "destination_warehouse": {
            "id": dest_stock.warehouse_id,
            "name": dest_stock.warehouse.warehouse_name,
            "new_available": dest_stock.available_quantity
        },
        "transfer_out_movement_id": mv_out.id,
        "transfer_in_movement_id": mv_in.id
    }
