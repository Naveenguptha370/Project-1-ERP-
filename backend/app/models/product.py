from datetime import datetime, timezone
from decimal import Decimal
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
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship
from app.database.session import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String(50), unique=True, index=True, nullable=False)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    barcode = Column(String(100), unique=True, index=True, nullable=True)
    product_name = Column(String(150), index=True, nullable=False)
    description = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), index=True, nullable=True)
    unit = Column(String(30), default="pcs", nullable=False)  # pcs, Units, kg, box, etc.

    # Financial fields
    cost_price = Column(Numeric(12, 2), default=0.00, nullable=False)
    selling_price = Column(Numeric(12, 2), default=0.00, nullable=False)
    tax_percentage = Column(Numeric(5, 2), default=0.00, nullable=False)

    # Stock control thresholds
    reorder_level = Column(Integer, default=10, nullable=False)
    minimum_stock_level = Column(Integer, default=5, nullable=False)
    maximum_stock_level = Column(Integer, default=1000, nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    category = relationship("Category", back_populates="products")
    creator = relationship("User", foreign_keys=[created_by])
    inventory_items = relationship("WarehouseStock", back_populates="product", cascade="all, delete-orphan")
    stock_movements = relationship("StockMovement", back_populates="product")

    def __init__(self, **kwargs):
        if "name" in kwargs and "product_name" not in kwargs:
            kwargs["product_name"] = kwargs.pop("name")
        if "unit_price" in kwargs and "selling_price" not in kwargs:
            kwargs["selling_price"] = kwargs.pop("unit_price")
        if "tax_rate" in kwargs and "tax_percentage" not in kwargs:
            kwargs["tax_percentage"] = kwargs.pop("tax_rate")
        if "stock_quantity" in kwargs:
            self._stock_quantity = kwargs.pop("stock_quantity")
        if "product_code" not in kwargs and "sku" in kwargs:
            kwargs["product_code"] = f"PRD-{kwargs['sku']}"
        super().__init__(**kwargs)

    @hybrid_property
    def name(self) -> str:
        return self.product_name

    @name.setter
    def name(self, val: str):
        self.product_name = val

    @name.expression
    def name(cls):
        return cls.product_name

    @hybrid_property
    def unit_price(self) -> float:
        return float(self.selling_price or 0.0)

    @unit_price.setter
    def unit_price(self, val: float):
        self.selling_price = val

    @unit_price.expression
    def unit_price(cls):
        return cls.selling_price

    @hybrid_property
    def tax_rate(self) -> float:
        return float(self.tax_percentage or 0.0)

    @tax_rate.setter
    def tax_rate(self, val: float):
        self.tax_percentage = val

    @tax_rate.expression
    def tax_rate(cls):
        return cls.tax_percentage

    @property
    def total_stock(self) -> int:
        if self.inventory_items:
            return sum(item.available_quantity for item in self.inventory_items)
        return getattr(self, "_stock_quantity", 0)

    @property
    def stock_quantity(self) -> int:
        return self.total_stock

    @property
    def stock_status(self) -> str:
        stock = self.total_stock
        if stock <= 0:
            return "OUT OF STOCK"
        elif stock <= self.reorder_level:
            return "LOW STOCK"
        return "IN STOCK"
