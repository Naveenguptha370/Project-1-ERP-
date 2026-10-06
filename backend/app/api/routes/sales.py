from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

# Schemas
from app.schemas.quotation import (
    QuotationCreate,
    QuotationUpdate,
    QuotationOut,
    QuotationStatusUpdate,
)
from app.schemas.sales_order import (
    SalesOrderCreate,
    SalesOrderUpdate,
    SalesOrderOut,
    SalesOrderStatusUpdate,
)
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceOut,
    InvoiceStatusUpdate,
)
from app.schemas.payment import (
    PaymentCreate,
    PaymentOut,
)
from app.schemas.analytics import SalesDashboardOut

# Services
from app.services import (
    quotation_service,
    sales_order_service,
    invoice_service,
    payment_service,
    analytics_service,
)

router = APIRouter(prefix="/sales", tags=["Member 5: Sales Module"])


# ==========================================
# 1. SALES ANALYTICS & DASHBOARD
# ==========================================
@router.get("/analytics/dashboard", response_model=SalesDashboardOut)
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve full Sales KPIs, monthly trends, top products and transaction feeds."""
    return analytics_service.get_sales_dashboard_metrics(db)


# ==========================================
# 2. QUOTATIONS ENDPOINTS
# ==========================================
@router.get("/quotations", response_model=List[QuotationOut])
def list_quotations(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all quotations with optional status filter and search query."""
    return quotation_service.get_quotations(
        db, skip=skip, limit=limit, status_filter=status, search=search
    )


@router.post("/quotations", response_model=QuotationOut, status_code=status.HTTP_201_CREATED)
def create_quotation(
    quote_in: QuotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new commercial quotation with calculated line items."""
    return quotation_service.create_quotation(db, quote_in, user_id=current_user.id)


@router.get("/quotations/{quotation_id}", response_model=QuotationOut)
def get_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single quotation details by ID."""
    return quotation_service.get_quotation_by_id(db, quotation_id)


@router.patch("/quotations/{quotation_id}/status", response_model=QuotationOut)
def update_quotation_status(
    quotation_id: int,
    status_update: QuotationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update status of a quotation (e.g. Sent, Accepted, Rejected)."""
    return quotation_service.update_quotation_status(
        db, quotation_id, status_update.status, user_id=current_user.id
    )


@router.post("/quotations/{quotation_id}/convert-to-order", response_model=SalesOrderOut)
def convert_quotation_to_order(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Convert an accepted quotation directly into an active Sales Order."""
    return quotation_service.convert_to_sales_order(db, quotation_id, user_id=current_user.id)


@router.delete("/quotations/{quotation_id}")
def delete_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete quotation if not already converted to Sales Order."""
    quotation_service.delete_quotation(db, quotation_id, user_id=current_user.id)
    return {"message": "Quotation deleted successfully"}


# ==========================================
# 3. SALES ORDERS ENDPOINTS
# ==========================================
@router.get("/orders", response_model=List[SalesOrderOut])
def list_sales_orders(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all sales orders with status filtering and search query."""
    return sales_order_service.get_sales_orders(
        db, skip=skip, limit=limit, status_filter=status, search=search
    )


@router.post("/orders", response_model=SalesOrderOut, status_code=status.HTTP_201_CREATED)
def create_sales_order(
    order_in: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new sales order directly with line items."""
    return sales_order_service.create_sales_order(db, order_in, user_id=current_user.id)


@router.get("/orders/{order_id}", response_model=SalesOrderOut)
def get_sales_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single sales order details by ID."""
    return sales_order_service.get_sales_order_by_id(db, order_id)


@router.patch("/orders/{order_id}/status", response_model=SalesOrderOut)
def update_sales_order_status(
    order_id: int,
    status_update: SalesOrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update progression status of a sales order (Draft -> Confirmed -> Processing -> Shipped -> Delivered)."""
    return sales_order_service.update_sales_order_status(
        db, order_id, status_update.status, user_id=current_user.id
    )


@router.post("/orders/{order_id}/convert-to-invoice", response_model=InvoiceOut)
def convert_order_to_invoice(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Convert a sales order into a commercial invoice for billing."""
    return sales_order_service.convert_to_invoice(db, order_id, user_id=current_user.id)


@router.delete("/orders/{order_id}")
def delete_sales_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a sales order if not yet invoiced."""
    sales_order_service.delete_sales_order(db, order_id, user_id=current_user.id)
    return {"message": "Sales order deleted successfully"}


# ==========================================
# 4. INVOICES ENDPOINTS
# ==========================================
@router.get("/invoices", response_model=List[InvoiceOut])
def list_invoices(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all commercial invoices."""
    return invoice_service.get_invoices(
        db, skip=skip, limit=limit, status_filter=status, search=search
    )


@router.post("/invoices", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def create_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a standalone invoice."""
    return invoice_service.create_invoice(db, invoice_in, user_id=current_user.id)


@router.get("/invoices/{invoice_id}", response_model=InvoiceOut)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single invoice details by ID."""
    return invoice_service.get_invoice_by_id(db, invoice_id)


@router.patch("/invoices/{invoice_id}/status", response_model=InvoiceOut)
def update_invoice_status(
    invoice_id: int,
    status_update: InvoiceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update status of an invoice."""
    return invoice_service.update_invoice_status(
        db, invoice_id, status_update.status, user_id=current_user.id
    )


@router.delete("/invoices/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an invoice if no payments have been registered."""
    invoice_service.delete_invoice(db, invoice_id, user_id=current_user.id)
    return {"message": "Invoice deleted successfully"}


# ==========================================
# 5. PAYMENTS ENDPOINTS
# ==========================================
@router.get("/payments", response_model=List[PaymentOut])
def list_payments(
    skip: int = 0,
    limit: int = 100,
    invoice_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List payments with optional filtering by invoice ID or search query."""
    return payment_service.get_payments(
        db, skip=skip, limit=limit, invoice_id=invoice_id, search=search
    )


@router.post("/payments", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def record_payment(
    payment_in: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record an incoming payment against an invoice and automatically adjust balance and status."""
    return payment_service.record_payment(db, payment_in, user_id=current_user.id)


@router.get("/payments/{payment_id}", response_model=PaymentOut)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single payment receipt details by ID."""
    return payment_service.get_payment_by_id(db, payment_id)
