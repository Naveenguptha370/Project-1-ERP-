from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.sales_order import SalesOrder, SalesOrderItem
from app.models.invoice import Invoice, InvoiceItem
from app.models.customer import Customer
from app.schemas.sales_order import SalesOrderCreate, SalesOrderUpdate
from app.services.audit_service import log_audit_event


def generate_order_number(db: Session) -> str:
    """Generate sequential sales order number, e.g. SO-2026-0001."""
    year = datetime.now().year
    prefix = f"SO-{year}-"
    last_order = (
        db.query(SalesOrder)
        .filter(SalesOrder.order_number.like(f"{prefix}%"))
        .order_by(SalesOrder.id.desc())
        .first()
    )
    if last_order:
        try:
            last_num = int(last_order.order_number.split("-")[-1])
            new_num = last_num + 1
        except Exception:
            new_num = 1
    else:
        new_num = 1
    return f"{prefix}{new_num:04d}"


def get_sales_orders(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    search: Optional[str] = None
) -> List[SalesOrder]:
    """Get list of sales orders with filtering and search."""
    query = db.query(SalesOrder)
    if status_filter:
        query = query.filter(SalesOrder.status == status_filter)
    if search:
        query = query.filter(
            (SalesOrder.order_number.ilike(f"%{search}%")) |
            (SalesOrder.customer_name.ilike(f"%{search}%"))
        )
    return query.order_by(SalesOrder.id.desc()).offset(skip).limit(limit).all()


def get_sales_order_by_id(db: Session, order_id: int) -> SalesOrder:
    """Get single sales order by ID."""
    order = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sales Order with ID {order_id} not found"
        )
    return order


def create_sales_order(db: Session, order_in: SalesOrderCreate, user_id: Optional[int] = None) -> SalesOrder:
    """Create a new sales order manually with line items."""
    order_number = generate_order_number(db)
    
    order = SalesOrder(
        order_number=order_number,
        quotation_id=order_in.quotation_id,
        customer_id=order_in.customer_id,
        customer_name=order_in.customer_name,
        customer_email=order_in.customer_email,
        customer_phone=order_in.customer_phone,
        shipping_address=order_in.shipping_address,
        billing_address=order_in.billing_address,
        order_date=order_in.order_date or datetime.now(timezone.utc),
        expected_delivery_date=order_in.expected_delivery_date,
        status=order_in.status or "Draft",
        notes=order_in.notes,
        created_by_id=user_id,
    )
    
    subtotal = 0.0
    total_tax = 0.0
    total_discount = 0.0
    
    for item_in in order_in.items:
        qty = float(item_in.quantity or 1.0)
        price = float(item_in.unit_price or 0.0)
        disc_pct = float(item_in.discount_percent or 0.0)
        tax_pct = float(item_in.tax_rate or 0.0)

        base = qty * price
        discount_val = base * (disc_pct / 100.0)
        after_discount = base - discount_val
        tax_val = after_discount * (tax_pct / 100.0)
        line_total = round(after_discount + tax_val, 2)

        subtotal += base
        total_discount += discount_val
        total_tax += tax_val

        item = SalesOrderItem(
            product_id=item_in.product_id,
            product_name=item_in.product_name,
            description=item_in.description,
            quantity=item_in.quantity,
            unit_price=item_in.unit_price,
            discount_percent=item_in.discount_percent,
            tax_rate=item_in.tax_rate,
            total_amount=line_total
        )
        order.items.append(item)

    order.subtotal = round(subtotal, 2)
    order.discount_amount = round(total_discount, 2)
    order.tax_amount = round(total_tax, 2)
    order.total_amount = round(subtotal - total_discount + total_tax, 2)

    db.add(order)
    db.commit()
    db.refresh(order)

    log_audit_event(
        db=db,
        action="SALES_ORDER_CREATED",
        user_id=user_id,
        details=f"Created Sales Order {order.order_number} for {order.customer_name} totaling {order.total_amount}"
    )
    return order


def update_sales_order_status(db: Session, order_id: int, new_status: str, user_id: Optional[int] = None) -> SalesOrder:
    """Update progression status of a Sales Order."""
    order = get_sales_order_by_id(db, order_id)
    old_status = order.status
    order.status = new_status
    db.commit()
    db.refresh(order)

    log_audit_event(
        db=db,
        action="SALES_ORDER_STATUS_CHANGED",
        user_id=user_id,
        details=f"Sales Order {order.order_number} status changed from {old_status} to {new_status}"
    )
    return order


def convert_to_invoice(db: Session, order_id: int, user_id: Optional[int] = None) -> Invoice:
    """Convert an existing Sales Order into a commercial Invoice."""
    order = get_sales_order_by_id(db, order_id)

    if order.invoice_id:
        existing_inv = db.query(Invoice).filter(Invoice.id == order.invoice_id).first()
        if existing_inv:
            return existing_inv

    # Generate sequential invoice number: INV-YYYY-XXXX
    year = datetime.now().year
    prefix = f"INV-{year}-"
    last_inv = (
        db.query(Invoice)
        .filter(Invoice.invoice_number.like(f"{prefix}%"))
        .order_by(Invoice.id.desc())
        .first()
    )
    if last_inv:
        try:
            last_num = int(last_inv.invoice_number.split("-")[-1])
            new_num = last_num + 1
        except Exception:
            new_num = 1
    else:
        new_num = 1
    invoice_number = f"{prefix}{new_num:04d}"

    invoice = Invoice(
        invoice_number=invoice_number,
        sales_order_id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        customer_phone=order.customer_phone,
        customer_address=order.billing_address or order.shipping_address,
        issue_date=datetime.now(timezone.utc),
        due_date=datetime.now(timezone.utc) + timedelta(days=30),
        status="Unpaid",
        subtotal=order.subtotal,
        discount_amount=order.discount_amount,
        tax_amount=order.tax_amount,
        total_amount=order.total_amount,
        amount_paid=0.0,
        balance_due=order.total_amount,
        notes=f"Generated from Sales Order {order.order_number}. {order.notes or ''}",
        payment_terms="Net 30 Days",
        created_by_id=user_id,
    )

    for item in order.items:
        inv_item = InvoiceItem(
            product_id=item.product_id,
            product_name=item.product_name,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount_percent=item.discount_percent,
            tax_rate=item.tax_rate,
            total_amount=item.total_amount,
        )
        invoice.items.append(inv_item)

    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    # Link back to Sales Order
    order.invoice_id = invoice.id
    if order.status in ["Draft", "Confirmed"]:
        order.status = "Processing"
    db.commit()

    log_audit_event(
        db=db,
        action="ORDER_CONVERTED_TO_INVOICE",
        user_id=user_id,
        details=f"Sales Order {order.order_number} converted into Invoice {invoice.invoice_number}"
    )
    return invoice


def delete_sales_order(db: Session, order_id: int, user_id: Optional[int] = None) -> bool:
    """Delete a sales order if not yet invoiced."""
    order = get_sales_order_by_id(db, order_id)
    if order.invoice_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete an order that has already been converted to an Invoice"
        )
    db.delete(order)
    db.commit()
    log_audit_event(
        db=db,
        action="SALES_ORDER_DELETED",
        user_id=user_id,
        details=f"Deleted Sales Order {order.order_number}"
    )
    return True
