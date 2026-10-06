from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.payment import Payment
from app.models.invoice import Invoice
from app.schemas.payment import PaymentCreate
from app.services.audit_service import log_audit_event


def generate_payment_number(db: Session) -> str:
    """Generate sequential payment receipt number, e.g. PAY-2026-0001."""
    year = datetime.now().year
    prefix = f"PAY-{year}-"
    last_pay = (
        db.query(Payment)
        .filter(Payment.payment_number.like(f"{prefix}%"))
        .order_by(Payment.id.desc())
        .first()
    )
    if last_pay:
        try:
            last_num = int(last_pay.payment_number.split("-")[-1])
            new_num = last_num + 1
        except Exception:
            new_num = 1
    else:
        new_num = 1
    return f"{prefix}{new_num:04d}"


def get_payments(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    invoice_id: Optional[int] = None,
    search: Optional[str] = None
) -> List[Payment]:
    """Retrieve payments list with filtering."""
    query = db.query(Payment)
    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)
    if search:
        query = query.filter(
            (Payment.payment_number.ilike(f"%{search}%")) |
            (Payment.customer_name.ilike(f"%{search}%")) |
            (Payment.reference_number.ilike(f"%{search}%"))
        )
    return query.order_by(Payment.id.desc()).offset(skip).limit(limit).all()


def get_payment_by_id(db: Session, payment_id: int) -> Payment:
    """Get single payment record by ID."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment record {payment_id} not found"
        )
    return payment


def record_payment(db: Session, pay_in: PaymentCreate, user_id: Optional[int] = None) -> Payment:
    """Record an incoming payment against an invoice and auto-settle invoice balance."""
    invoice = db.query(Invoice).filter(Invoice.id == pay_in.invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target Invoice with ID {pay_in.invoice_id} not found"
        )
        
    if invoice.status == "Paid" and invoice.balance_due <= 0.001:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invoice {invoice.invoice_number} is already fully paid"
        )

    if pay_in.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount must be greater than zero"
        )

    payment_number = generate_payment_number(db)
    
    payment = Payment(
        payment_number=payment_number,
        invoice_id=invoice.id,
        customer_id=pay_in.customer_id or invoice.customer_id,
        customer_name=pay_in.customer_name or invoice.customer_name,
        payment_date=pay_in.payment_date or datetime.now(timezone.utc),
        payment_method=pay_in.payment_method or "Bank Transfer",
        reference_number=pay_in.reference_number,
        amount=round(pay_in.amount, 2),
        notes=pay_in.notes,
        status=pay_in.status or "Completed",
        created_by_id=user_id,
    )
    
    db.add(payment)

    # Automatically settle invoice
    new_paid = round(invoice.amount_paid + payment.amount, 2)
    invoice.amount_paid = new_paid
    new_balance = round(invoice.total_amount - new_paid, 2)
    invoice.balance_due = max(0.0, new_balance)

    if invoice.balance_due <= 0.01:
        invoice.status = "Paid"
    else:
        invoice.status = "Partially Paid"

    db.commit()
    db.refresh(payment)
    db.refresh(invoice)

    log_audit_event(
        db=db,
        action="PAYMENT_RECEIVED",
        user_id=user_id,
        details=f"Payment {payment.payment_number} of {payment.amount} recorded for Invoice {invoice.invoice_number} via {payment.payment_method}. New invoice balance: {invoice.balance_due}"
    )
    return payment
