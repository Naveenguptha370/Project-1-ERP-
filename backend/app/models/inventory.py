from datetime import datetime, timezone

from app.database import Base
from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, UniqueConstraint
from sqlalchemy.orm import relationship


class WarehouseStock(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity_on_hand = Column(Integer, default=0, nullable=False)
    reserved_quantity = Column(Integer, default=0, nullable=False)
    available_quantity = Column(Integer, default=0, nullable=False)
    reorder_level = Column(Integer, default=10, nullable=False)
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("product_id", "warehouse_id", name="uq_product_warehouse"),
        Index("idx_inv_product_warehouse", "product_id", "warehouse_id"),
    )

    # Relationships
    product = relationship("Product", back_populates="inventory_items")
    warehouse = relationship("Warehouse", back_populates="inventory_items")

    def sync_available(self):
        """Ensure available_quantity is consistently quantity_on_hand - reserved_quantity."""
        self.available_quantity = max(0, self.quantity_on_hand - self.reserved_quantity)
