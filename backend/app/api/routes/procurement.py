from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.business import PurchaseOrder, PurchaseOrderItem, Supplier
from app.models.inventory import WarehouseStock
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.models.warehouse import Warehouse
from app.schemas.procurement import (
    PurchaseOrderCreate,
    PurchaseOrderResponse,
    PurchaseOrderStatusUpdate,
    SupplierCreate,
    SupplierResponse,
    SupplierUpdate,
)

router = APIRouter(prefix="/procurement", tags=["Procurement"])


@router.get("/status")
def procurement_status(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return {
        "module": "Procurement",
        "status": "active",
        "suppliers": db.query(Supplier).count(),
        "purchase_orders": db.query(PurchaseOrder).count(),
    }


@router.get("/suppliers", response_model=list[SupplierResponse])
def list_suppliers(
    active_only: bool = True,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Supplier)
    if active_only:
        query = query.filter(Supplier.is_active.is_(True))
    return query.order_by(Supplier.company_name).offset(skip).limit(limit).all()


@router.post("/suppliers", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    payload: SupplierCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if db.query(Supplier).filter(Supplier.supplier_code == payload.supplier_code).first():
        raise HTTPException(status_code=409, detail="Supplier code already exists")
    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.patch("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    payload: SupplierUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/suppliers/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    if supplier.purchase_orders:
        raise HTTPException(status_code=409, detail="Supplier has purchase orders; deactivate it instead")
    db.delete(supplier)
    db.commit()


@router.get("/purchase-orders", response_model=list[PurchaseOrderResponse])
def list_purchase_orders(
    status_filter: str | None = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(PurchaseOrder).options(selectinload(PurchaseOrder.items))
    if status_filter:
        query = query.filter(PurchaseOrder.status == status_filter)
    return query.order_by(PurchaseOrder.id.desc()).offset(skip).limit(limit).all()


@router.post(
    "/purchase-orders",
    response_model=PurchaseOrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_purchase_order(
    payload: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    supplier = db.get(Supplier, payload.supplier_id)
    warehouse = db.get(Warehouse, payload.warehouse_id)
    if not supplier or not supplier.is_active:
        raise HTTPException(status_code=404, detail="Active supplier not found")
    if not warehouse or not warehouse.is_active:
        raise HTTPException(status_code=404, detail="Active warehouse not found")

    order = PurchaseOrder(
        order_number=f"PO-{datetime.now(timezone.utc):%Y%m%d}-{uuid4().hex[:8].upper()}",
        supplier_id=supplier.id,
        warehouse_id=warehouse.id,
        expected_date=payload.expected_date,
        notes=payload.notes,
        created_by_id=user.id,
    )
    subtotal = Decimal("0")
    tax_total = Decimal("0")
    for item_input in payload.items:
        product = db.get(Product, item_input.product_id)
        if not product or not product.is_active:
            raise HTTPException(status_code=404, detail=f"Active product {item_input.product_id} not found")
        unit_cost = item_input.unit_cost if item_input.unit_cost is not None else Decimal(str(product.cost_price or 0))
        line_subtotal = unit_cost * item_input.quantity
        line_tax = (line_subtotal * item_input.tax_rate / Decimal("100")).quantize(Decimal("0.01"))
        subtotal += line_subtotal
        tax_total += line_tax
        order.items.append(
            PurchaseOrderItem(
                product_id=product.id,
                product_name=product.product_name,
                quantity=item_input.quantity,
                unit_cost=unit_cost,
                tax_rate=item_input.tax_rate,
                line_total=line_subtotal + line_tax,
            )
        )
    order.subtotal = subtotal
    order.tax_amount = tax_total
    order.total_amount = subtotal + tax_total
    db.add(order)
    db.commit()
    return db.query(PurchaseOrder).options(selectinload(PurchaseOrder.items)).filter(
        PurchaseOrder.id == order.id
    ).one()


@router.patch("/purchase-orders/{order_id}/status", response_model=PurchaseOrderResponse)
def update_purchase_order_status(
    order_id: int,
    payload: PurchaseOrderStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = (
        db.query(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .filter(PurchaseOrder.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    allowed_transitions = {
        "Draft": {"Ordered", "Cancelled"},
        "Ordered": {"Received", "Cancelled"},
    }
    if payload.status not in allowed_transitions.get(order.status, set()):
        raise HTTPException(
            status_code=409,
            detail=f"Cannot change purchase order from {order.status} to {payload.status}",
        )

    if payload.status == "Received":
        warehouse = db.get(Warehouse, order.warehouse_id)
        if not warehouse or not warehouse.is_active:
            raise HTTPException(status_code=409, detail="Purchase order warehouse is unavailable")
        for item in order.items:
            stock = (
                db.query(WarehouseStock)
                .filter(
                    WarehouseStock.product_id == item.product_id,
                    WarehouseStock.warehouse_id == order.warehouse_id,
                )
                .with_for_update()
                .first()
            )
            if stock is None:
                stock = WarehouseStock(
                    product_id=item.product_id,
                    warehouse_id=order.warehouse_id,
                    quantity_on_hand=0,
                    reserved_quantity=0,
                    available_quantity=0,
                )
                db.add(stock)
                db.flush()
            before = stock.quantity_on_hand
            stock.quantity_on_hand += item.quantity
            stock.sync_available()
            db.add(
                StockMovement(
                    product_id=item.product_id,
                    warehouse_id=order.warehouse_id,
                    movement_type="PURCHASE",
                    quantity=item.quantity,
                    quantity_before=before,
                    quantity_after=stock.quantity_on_hand,
                    reference_type="PURCHASE_ORDER",
                    reference_id=order.order_number,
                    notes=f"Goods received for {order.order_number}",
                    created_by=user.id,
                )
            )
        order.received_at = datetime.now(timezone.utc)
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order
