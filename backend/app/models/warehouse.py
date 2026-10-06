from datetime import datetime, timezone

from app.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.orm import relationship


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_code = Column(String(50), unique=True, index=True, nullable=False)
    warehouse_name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    inventory_items = relationship("WarehouseStock", back_populates="warehouse", cascade="all, delete-orphan")
    stock_movements = relationship("StockMovement", back_populates="warehouse", foreign_keys="StockMovement.warehouse_id")

    @property
    def total_products_count(self) -> int:
        return len(self.inventory_items) if self.inventory_items else 0

    @property
    def total_units_in_stock(self) -> int:
        if not self.inventory_items:
            return 0
        return sum(item.quantity_on_hand for item in self.inventory_items)
