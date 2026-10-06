from datetime import datetime, timezone

from app.database import Base
from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="RESTRICT"), nullable=False, index=True)
    movement_type = Column(String(50), nullable=False, index=True) 
    # Movement Types: STOCK_IN, STOCK_OUT, PURCHASE, SALE, TRANSFER_IN, TRANSFER_OUT, ADJUSTMENT_IN, ADJUSTMENT_OUT, RETURN_IN, RETURN_OUT
    quantity = Column(Integer, nullable=False)
    quantity_before = Column(Integer, nullable=False)
    quantity_after = Column(Integer, nullable=False)
    source_warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="SET NULL"), nullable=True)
    destination_warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="SET NULL"), nullable=True)
    reference_type = Column(String(50), nullable=True)  # e.g., MANUAL, SALES_ORDER, PURCHASE_ORDER, TRANSFER, ADJUSTMENT
    reference_id = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    __table_args__ = (
        Index("idx_movement_product_created", "product_id", "created_at"),
        Index("idx_movement_warehouse_created", "warehouse_id", "created_at"),
    )

    # Relationships
    product = relationship("Product", back_populates="stock_movements")
    warehouse = relationship("Warehouse", foreign_keys=[warehouse_id], back_populates="stock_movements")
    source_warehouse = relationship("Warehouse", foreign_keys=[source_warehouse_id])
    destination_warehouse = relationship("Warehouse", foreign_keys=[destination_warehouse_id])
    creator = relationship("User", foreign_keys=[created_by])
