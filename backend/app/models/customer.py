from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    company_name = Column(String(150), nullable=True)
    email = Column(String(100), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), default="India")
    tax_id = Column(String(50), nullable=True)  # GSTIN or VAT number
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    quotations = relationship("Quotation", back_populates="customer")
    sales_orders = relationship("SalesOrder", back_populates="customer")
    invoices = relationship("Invoice", back_populates="customer")
