from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base


class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    quotation_id = Column(Integer, ForeignKey("quotations.id", ondelete="SET NULL"), nullable=True)

    # Customer Info
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    customer_name = Column(String(150), nullable=False)
    customer_email = Column(String(100), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    shipping_address = Column(Text, nullable=True)
    billing_address = Column(Text, nullable=True)

    # Dates
    order_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expected_delivery_date = Column(DateTime, nullable=True)

    # Status: Draft, Confirmed, Processing, Shipped, Delivered, Cancelled
    status = Column(String(50), default="Draft", index=True)

    # Financials
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)

    # Metadata & conversion
    invoice_id = Column(Integer, nullable=True)  # Populated when converted to Invoice
    notes = Column(Text, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    customer = relationship("Customer", back_populates="sales_orders")
    quotation = relationship("Quotation")
    created_by = relationship("User")
    items = relationship("SalesOrderItem", back_populates="sales_order", cascade="all, delete-orphan", lazy="joined")


class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"

    id = Column(Integer, primary_key=True, index=True)
    sales_order_id = Column(Integer, ForeignKey("sales_orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    
    product_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    discount_percent = Column(Float, default=0.0)
    tax_rate = Column(Float, default=18.0)
    total_amount = Column(Float, default=0.0)

    # Relationships
    sales_order = relationship("SalesOrder", back_populates="items")
    product = relationship("Product")
