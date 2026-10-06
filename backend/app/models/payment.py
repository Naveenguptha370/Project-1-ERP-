from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_number = Column(String(50), unique=True, index=True, nullable=False)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    customer_name = Column(String(150), nullable=False)
    
    payment_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    payment_method = Column(String(50), default="Bank Transfer")  # Cash, Bank Transfer, Credit Card, UPI, Cheque
    reference_number = Column(String(100), nullable=True)  # Cheque / Transaction / UTR reference
    amount = Column(Float, nullable=False, default=0.0)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="Completed", index=True)  # Completed, Pending, Failed, Refunded

    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
    customer = relationship("Customer")
    created_by = relationship("User")
