from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database.session import Base


class Lead(Base):
    __tablename__ = "crm_leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    company_name = Column(String(150), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    source = Column(String(80), nullable=True)
    status = Column(String(30), nullable=False, default="New", index=True)
    estimated_value = Column(Numeric(12, 2), nullable=False, default=0)
    notes = Column(Text, nullable=True)
    assigned_to_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    converted_customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    activities = relationship("CRMActivity", back_populates="lead", cascade="all, delete-orphan")


class CRMActivity(Base):
    __tablename__ = "crm_activities"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=True, index=True)
    lead_id = Column(Integer, ForeignKey("crm_leads.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(80), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), index=True)

    customer = relationship("Customer")
    lead = relationship("Lead", back_populates="activities")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    supplier_code = Column(String(50), nullable=False, unique=True, index=True)
    company_name = Column(String(150), nullable=False, index=True)
    contact_name = Column(String(120), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    tax_id = Column(String(60), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), nullable=False, unique=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="RESTRICT"), nullable=False)
    status = Column(String(20), nullable=False, default="Draft", index=True)
    order_date = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    expected_date = Column(DateTime, nullable=True)
    received_at = Column(DateTime, nullable=True)
    subtotal = Column(Numeric(12, 2), nullable=False, default=0)
    tax_amount = Column(Numeric(12, 2), nullable=False, default=0)
    total_amount = Column(Numeric(12, 2), nullable=False, default=0)
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    product_name = Column(String(150), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Numeric(12, 2), nullable=False)
    tax_rate = Column(Numeric(5, 2), nullable=False, default=0)
    line_total = Column(Numeric(12, 2), nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    expense_number = Column(String(50), nullable=False, unique=True, index=True)
    category = Column(String(80), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    vendor = Column(String(150), nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)
    expense_date = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    status = Column(String(20), nullable=False, default="Submitted", index=True)
    payment_method = Column(String(50), nullable=True)
    reference_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    review_note = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime, nullable=True)
