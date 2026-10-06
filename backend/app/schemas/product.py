from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Union
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductBase(BaseModel):
    product_code: str = Field(default="", max_length=50, description="Unique product code (e.g. PRD-001)")
    sku: str = Field(..., min_length=2, max_length=50, description="Unique Stock Keeping Unit (e.g. SKU-ELEC-01)")
    barcode: Optional[str] = Field(None, max_length=100)
    product_name: str = Field(default="", max_length=150)
    description: Optional[str] = None
    category_id: Optional[int] = None
    unit: str = Field(default="pcs", max_length=30)
    cost_price: Decimal = Field(default=Decimal("0.00"), ge=0, description="Cost price cannot be negative")
    selling_price: Decimal = Field(default=Decimal("0.00"), ge=0, description="Selling price cannot be negative")
    tax_percentage: Decimal = Field(default=Decimal("0.00"), ge=0, le=100, description="Tax percentage between 0 and 100")
    reorder_level: int = Field(default=10, ge=0, description="Reorder threshold >= 0")
    minimum_stock_level: int = Field(default=5, ge=0)
    maximum_stock_level: int = Field(default=1000, ge=0)
    is_active: bool = True

    @field_validator("sku")
    @classmethod
    def validate_code_or_sku(cls, v: str) -> str:
        v = v.strip().upper()
        if not v:
            raise ValueError("SKU cannot be blank")
        return v


class ProductCreate(BaseModel):
    product_code: Optional[str] = None
    sku: str
    barcode: Optional[str] = None
    product_name: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    category: Optional[str] = "General"
    unit: Optional[str] = "pcs"
    cost_price: Optional[Decimal] = Field(default=Decimal("0.00"), ge=0)
    selling_price: Optional[Decimal] = Field(default=Decimal("0.00"), ge=0)
    unit_price: Optional[float] = Field(default=None, ge=0)
    tax_percentage: Optional[Decimal] = Decimal("0.00")
    tax_rate: Optional[float] = None
    stock_quantity: Optional[int] = 100
    reorder_level: Optional[int] = 10
    minimum_stock_level: Optional[int] = 5
    maximum_stock_level: Optional[int] = 1000
    is_active: bool = True

    def model_post_init(self, __context):
        if not self.product_name and self.name:
            self.product_name = self.name
        if not self.product_name:
            self.product_name = self.sku
        if not self.product_code:
            self.product_code = f"PRD-{self.sku.upper()}"
        if self.unit_price is not None and (self.selling_price is None or self.selling_price == Decimal("0.00")):
            self.selling_price = Decimal(str(self.unit_price))
        if self.tax_rate is not None and (self.tax_percentage is None or self.tax_percentage == Decimal("0.00")):
            self.tax_percentage = Decimal(str(self.tax_rate))


class ProductUpdate(BaseModel):
    product_code: Optional[str] = Field(None, min_length=2, max_length=50)
    sku: Optional[str] = Field(None, min_length=2, max_length=50)
    barcode: Optional[str] = Field(None, max_length=100)
    product_name: Optional[str] = Field(None, min_length=2, max_length=150)
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    category: Optional[str] = None
    unit: Optional[str] = Field(None, max_length=30)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    selling_price: Optional[Decimal] = Field(None, ge=0)
    unit_price: Optional[float] = None
    tax_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    tax_rate: Optional[float] = None
    stock_quantity: Optional[int] = None
    reorder_level: Optional[int] = Field(None, ge=0)
    minimum_stock_level: Optional[int] = Field(None, ge=0)
    maximum_stock_level: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class WarehouseStockSummary(BaseModel):
    warehouse_id: int
    warehouse_name: str
    warehouse_code: str
    quantity_on_hand: int
    reserved_quantity: int
    available_quantity: int


class ProductResponse(BaseModel):
    id: int
    product_code: str
    sku: str
    barcode: Optional[str] = None
    product_name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    unit: str = "pcs"
    cost_price: Decimal = Decimal("0.00")
    selling_price: Decimal = Decimal("0.00")
    tax_percentage: Decimal = Decimal("0.00")
    reorder_level: int = 10
    minimum_stock_level: int = 5
    maximum_stock_level: int = 1000
    is_active: bool = True
    total_stock: int = 0
    stock_status: str = "OUT OF STOCK"
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    warehouses_stock: List[WarehouseStockSummary] = []

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    total: int
    items: List[ProductResponse]


class ProductOut(BaseModel):
    id: int
    sku: str
    name: str = ""
    description: Optional[str] = None
    category: Optional[str] = "General"
    unit: Optional[str] = "Units"
    unit_price: float = 0.0
    cost_price: float = 0.0
    tax_rate: float = 18.0
    stock_quantity: int = 100
    is_active: bool = True
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
