from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.quotation import Quotation, QuotationItem
from app.models.sales_order import SalesOrder, SalesOrderItem
from app.models.customer import Customer
from app.schemas.quotation import QuotationCreate, QuotationUpdate
from app.services.audit_service import log_audit_event


def generate_quote_number(db: Session) -> str:
    """Generate professional sequential quotation number, e.g. QT-2026-0001."""
    year = datetime.now().year
    prefix = f"QT-{year}-"
    last_quote = (
        db.query(Quotation)
        .filter(Quotation.quote_number.like(f"{prefix}%"))
        .order_by(Quotation.id.desc())
        .first()
    )
    if last_quote:
        try:
            last_num = int(last_quote.quote_number.split("-")[-1])
            new_num = last_num + 1
        except Exception:
            new_num = 1
    else:
        new_num = 1
    return f"{prefix}{new_num:04d}"


def calculate_line_item(item_data) -> dict:
    """Calculate line item totals accurately."""
    qty = float(item_data.quantity or 1.0)
    price = float(item_data.unit_price or 0.0)
    disc_pct = float(item_data.discount_percent or 0.0)
    tax_pct = float(item_data.tax_rate or 0.0)

    base = qty * price
    discount_val = base * (disc_pct / 100.0)
    after_discount = base - discount_val
    tax_val = after_discount * (tax_pct / 100.0)
    line_total = after_discount + tax_val

    return {
        "base": base,
        "discount": discount_val,
        "tax": tax_val,
        "total": round(line_total, 2)
    }


def get_quotations(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    search: Optional[str] = None
) -> List[Quotation]:
    """Retrieve list of quotations with filtering and search."""
    query = db.query(Quotation)
    if status_filter:
        query = query.filter(Quotation.status == status_filter)
    if search:
        query = query.filter(
            (Quotation.quote_number.ilike(f"%{search}%")) |
            (Quotation.customer_name.ilike(f"%{search}%"))
        )
    return query.order_by(Quotation.id.desc()).offset(skip).limit(limit).all()


def get_quotation_by_id(db: Session, quotation_id: int) -> Quotation:
    """Get single quotation by ID or raise 404."""
    quote = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quotation with ID {quotation_id} not found"
        )
    return quote


def create_quotation(db: Session, quote_in: QuotationCreate, user_id: Optional[int] = None) -> Quotation:
    """Create a new sales quotation with line item calculation."""
    # Ensure customer exists or update
    if quote_in.customer_id:
        cust = db.query(Customer).filter(Customer.id == quote_in.customer_id).first()
        if cust and not quote_in.customer_name:
            quote_in.customer_name = cust.name

    quote_number = generate_quote_number(db)
    
    quote = Quotation(
        quote_number=quote_number,
        customer_id=quote_in.customer_id,
        customer_name=quote_in.customer_name,
        customer_email=quote_in.customer_email,
        customer_phone=quote_in.customer_phone,
        customer_address=quote_in.customer_address,
        issue_date=quote_in.issue_date or datetime.now(timezone.utc),
        valid_until=quote_in.valid_until,
        status=quote_in.status or "Draft",
        notes=quote_in.notes,
        terms=quote_in.terms,
        created_by_id=user_id,
    )
    
    subtotal = 0.0
    total_tax = 0.0
    total_discount = 0.0
    
    for item_in in quote_in.items:
        calc = calculate_line_item(item_in)
        subtotal += calc["base"]
        total_discount += calc["discount"]
        total_tax += calc["tax"]

        item = QuotationItem(
            product_id=item_in.product_id,
            product_name=item_in.product_name,
            description=item_in.description,
            quantity=item_in.quantity,
            unit_price=item_in.unit_price,
            discount_percent=item_in.discount_percent,
            tax_rate=item_in.tax_rate,
            total_amount=calc["total"]
        )
        quote.items.append(item)

    quote.subtotal = round(subtotal, 2)
    quote.discount_amount = round(total_discount, 2)
    quote.tax_amount = round(total_tax, 2)
    quote.total_amount = round(subtotal - total_discount + total_tax, 2)

    db.add(quote)
    db.commit()
    db.refresh(quote)

    log_audit_event(
        db=db,
        action="QUOTATION_CREATED",
        user_id=user_id,
        details=f"Created quotation {quote.quote_number} for {quote.customer_name} totaling {quote.total_amount}"
    )
    return quote


def update_quotation_status(db: Session, quotation_id: int, new_status: str, user_id: Optional[int] = None) -> Quotation:
    """Update status of a quotation (e.g. Sent, Accepted, Rejected)."""
    quote = get_quotation_by_id(db, quotation_id)
    old_status = quote.status
    quote.status = new_status
    db.commit()
    db.refresh(quote)

    log_audit_event(
        db=db,
        action="QUOTATION_STATUS_CHANGED",
        user_id=user_id,
        details=f"Quotation {quote.quote_number} status changed from {old_status} to {new_status}"
    )
    return quote


def convert_to_sales_order(db: Session, quotation_id: int, user_id: Optional[int] = None) -> SalesOrder:
    """Convert an accepted quotation into an active Sales Order seamlessly."""
    quote = get_quotation_by_id(db, quotation_id)
    
    # Check if already converted
    if quote.sales_order_id:
        existing_so = db.query(SalesOrder).filter(SalesOrder.id == quote.sales_order_id).first()
        if existing_so:
            return existing_so

    # Generate sequential Order Number: SO-YYYY-XXXX
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
    order_number = f"{prefix}{new_num:04d}"

    sales_order = SalesOrder(
        order_number=order_number,
        quotation_id=quote.id,
        customer_id=quote.customer_id,
        customer_name=quote.customer_name,
        customer_email=quote.customer_email,
        customer_phone=quote.customer_phone,
        shipping_address=quote.customer_address,
        billing_address=quote.customer_address,
        order_date=datetime.now(timezone.utc),
        status="Confirmed",
        subtotal=quote.subtotal,
        discount_amount=quote.discount_amount,
        tax_amount=quote.tax_amount,
        total_amount=quote.total_amount,
        notes=f"Generated from Quotation {quote.quote_number}. {quote.notes or ''}",
        created_by_id=user_id,
    )

    for item in quote.items:
        so_item = SalesOrderItem(
            product_id=item.product_id,
            product_name=item.product_name,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount_percent=item.discount_percent,
            tax_rate=item.tax_rate,
            total_amount=item.total_amount,
        )
        sales_order.items.append(so_item)

    db.add(sales_order)
    db.commit()
    db.refresh(sales_order)

    # Link back to quotation and update status
    quote.sales_order_id = sales_order.id
    quote.status = "Accepted"
    db.commit()

    log_audit_event(
        db=db,
        action="QUOTATION_CONVERTED_TO_ORDER",
        user_id=user_id,
        details=f"Quotation {quote.quote_number} converted into Sales Order {sales_order.order_number}"
    )
    return sales_order


def delete_quotation(db: Session, quotation_id: int, user_id: Optional[int] = None) -> bool:
    """Delete a quotation if it hasn't been converted to an order."""
    quote = get_quotation_by_id(db, quotation_id)
    if quote.sales_order_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a quotation that has already been converted to a Sales Order",
        )
    db.delete(quote)
    db.commit()
    log_audit_event(
        db=db,
        action="QUOTATION_DELETED",
        user_id=user_id,
        details=f"Deleted quotation {quote.quote_number}"
    )
    return True
