from datetime import datetime, timezone

from app.database import Base
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    category_code = Column(String(50), unique=True, index=True, nullable=False)
    category_name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    parent_category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    parent = relationship("Category", remote_side=[id], backref="subcategories")
    products = relationship("Product", back_populates="category", cascade="all")

    @property
    def product_count(self) -> int:
        return len(self.products) if self.products else 0
