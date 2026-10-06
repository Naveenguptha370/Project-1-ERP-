from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.invoice import Invoice, InvoiceItem
from app.models.customer import Customer
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate
from app.services.audit_service import log_audit_event


def generate_invoice_number(db: Session) -> str:
    """Generate sequential invoice number, e.g. INV-2026-0001."""
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
    return f"{prefix}{new_num:04d}"


def get_invoices(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    search: Optional[str] = None
) -> List[Invoice]:
    """Retrieve invoices with filtering and overdue status check."""
    query = db.query(Invoice)
    if status_filter:
        query = query.filter(Invoice.status == status_filter)
    if search:
        query = query.filter(
            (Invoice.invoice_number.ilike(f"%{search}%")) |
            (Invoice.customer_name.ilike(f"%{search}%"))
        )
    invoices = query.order_by(Invoice.id.desc()).offset(skip).limit(limit).all()

    # Dynamic check for Overdue status
    now = datetime.now(timezone.utc)
    for inv in invoices:
        if inv.status in ["Unpaid", "Partially Paid"] and inv.due_date and inv.due_date.replace(tzinfo=timezone.utc) < now:
            inv.status = "Overdue"
            db.commit()

    return invoices


def get_invoice_by_id(db: Session, invoice_id: int) -> Invoice:
    """Get single invoice by ID."""
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with ID {invoice_id} not found"
        )
    return inv


def create_invoice(db: Session, inv_in: InvoiceCreate, user_id: Optional[int] = None) -> Invoice:
    """Create a standalone commercial invoice."""
    inv_number = generate_invoice_number(db)
    
    issue_dt = inv_in.issue_date or datetime.now(timezone.utc)
    due_dt = inv_in.due_date or (issue_dt + timedelta(days=30))

    invoice = Invoice(
        invoice_number=inv_number,
        sales_order_id=inv_in.sales_order_id,
        customer_id=inv_in.customer_id,
        customer_name=inv_in.customer_name,
        customer_email=inv_in.customer_email,
        customer_phone=inv_in.customer_phone,
        customer_address=inv_in.customer_address,
        issue_date=issue_dt,
        due_date=due_dt,
        status="Unpaid",
        notes=inv_in.notes,
        payment_terms=inv_in.payment_terms or "Net 30 Days",
        created_by_id=user_id,
    )

    subtotal = 0.0
    total_tax = 0.0
    total_discount = 0.0

    for item_in in inv_in.items:
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

        item = InvoiceItem(
            product_id=item_in.product_id,
            product_name=item_in.product_name,
            description=item_in.description,
            quantity=item_in.quantity,
            unit_price=item_in.unit_price,
            discount_percent=item_in.discount_percent,
            tax_rate=item_in.tax_rate,
            total_amount=line_total,
        )
        invoice.items.append(item)

    invoice.subtotal = round(subtotal, 2)
    invoice.discount_amount = round(total_discount, 2)
    invoice.tax_amount = round(total_tax, 2)
    total = round(subtotal - total_discount + total_tax, 2)
    invoice.total_amount = total
    invoice.amount_paid = 0.0
    invoice.balance_due = total

    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    log_audit_event(
        db=db,
        action="INVOICE_CREATED",
        user_id=user_id,
        details=f"Created Invoice {invoice.invoice_number} for {invoice.customer_name} totaling {invoice.total_amount}"
    )
    return invoice


def update_invoice_status(db: Session, invoice_id: int, new_status: str, user_id: Optional[int] = None) -> Invoice:
    """Manually update invoice status."""
    inv = get_invoice_by_id(db, invoice_id)
    old = inv.status
    inv.status = new_status
    db.commit()
    db.refresh(inv)

    log_audit_event(
        db=db,
        action="INVOICE_STATUS_CHANGED",
        user_id=user_id,
        details=f"Invoice {inv.invoice_number} status changed from {old} to {new_status}"
    )
    return inv


def delete_invoice(db: Session, invoice_id: int, user_id: Optional[int] = None) -> bool:
    """Delete invoice if no payments have been registered."""
    inv = get_invoice_by_id(db, invoice_id)
    if inv.amount_paid > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete an invoice that has payments registered. Refund or void payments first."
        )
    db.delete(inv)
    db.commit()
    log_audit_event(
        db=db,
        action="INVOICE_DELETED",
        user_id=user_id,
        details=f"Deleted invoice {inv.invoice_number}"
    )
    return True
