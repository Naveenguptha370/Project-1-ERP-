from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    sales_order_id = Column(Integer, ForeignKey("sales_orders.id", ondelete="SET NULL"), nullable=True)

    # Customer Info
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    customer_name = Column(String(150), nullable=False)
    customer_email = Column(String(100), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    customer_address = Column(Text, nullable=True)

    # Dates
    issue_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    due_date = Column(DateTime, nullable=True)

    # Status: Draft, Unpaid, Partially Paid, Paid, Overdue, Cancelled
    status = Column(String(50), default="Unpaid", index=True)

    # Financials
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    amount_paid = Column(Float, default=0.0)
    balance_due = Column(Float, default=0.0)

    # Terms & Notes
    notes = Column(Text, nullable=True)
    payment_terms = Column(String(100), default="Due in 30 days")

    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    customer = relationship("Customer", back_populates="invoices")
    sales_order = relationship("SalesOrder")
    created_by = relationship("User")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan", lazy="joined")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan", lazy="joined")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    
    product_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    discount_percent = Column(Float, default=0.0)
    tax_rate = Column(Float, default=18.0)
    total_amount = Column(Float, default=0.0)

    # Relationships
    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product")
