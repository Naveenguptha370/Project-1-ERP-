from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StockInRequest(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: int = Field(..., gt=0, description="Quantity must be greater than zero")
    reference_type: str | None = Field(default="MANUAL", description="e.g. PURCHASE, MANUAL, RETURN")
    reference_number: str | None = None
    notes: str | None = None

class StockOutRequest(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: int = Field(..., gt=0, description="Quantity must be greater than zero")
    reference_type: str | None = Field(default="MANUAL", description="e.g. SALE, MANUAL, DAMAGE")
    reference_number: str | None = None
    notes: str | None = None

class StockAdjustmentRequest(BaseModel):
    product_id: int
    warehouse_id: int
    adjustment_type: str = Field(..., description="INCREASE or DECREASE")
    quantity: int = Field(..., gt=0, description="Quantity to adjust by")
    reason: str = Field(..., description="Reason for adjustment, e.g. Physical Count Correction, Damaged Goods, Expired Goods, Lost Goods, Data Correction, Other")
    notes: str | None = None

    @field_validator("adjustment_type")
    @classmethod
    def validate_adj_type(cls, v: str) -> str:
        v = v.strip().upper()
        if v not in ("INCREASE", "DECREASE"):
            raise ValueError("Adjustment type must be either 'INCREASE' or 'DECREASE'")
        return v

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Reason is required for inventory adjustments")
        return v

class StockTransferRequest(BaseModel):
    product_id: int
    source_warehouse_id: int
    destination_warehouse_id: int
    quantity: int = Field(..., gt=0, description="Quantity to transfer must be greater than zero")
    reference_number: str | None = None
    notes: str | None = None

    @field_validator("destination_warehouse_id")
    @classmethod
    def validate_different_warehouses(cls, v: int, info) -> int:
        source_id = info.data.get("source_warehouse_id")
        if source_id is not None and v == source_id:
            raise ValueError("Source and destination warehouses must be different.")
        return v

class InventoryItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_code: str
    sku: str
    category_id: int
    category_name: str | None = None
    warehouse_id: int
    warehouse_name: str
    warehouse_code: str
    quantity_on_hand: int
    reserved_quantity: int
    available_quantity: int
    reorder_level: int
    stock_status: str
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)

class InventoryListResponse(BaseModel):
    total: int
    items: list[InventoryItemResponse]

class StockMovementResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_code: str
    sku: str
    warehouse_id: int
    warehouse_name: str
    movement_type: str
    quantity: int
    quantity_before: int
    quantity_after: int
    source_warehouse_id: int | None = None
    source_warehouse_name: str | None = None
    destination_warehouse_id: int | None = None
    destination_warehouse_name: str | None = None
    reference_type: str | None = None
    reference_id: str | None = None
    notes: str | None = None
    created_by: int | None = None
    creator_name: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StockMovementListResponse(BaseModel):
    total: int
    items: list[StockMovementResponse]

class LowStockItemResponse(BaseModel):
    product_id: int
    product_name: str
    product_code: str
    sku: str
    category_name: str | None = None
    warehouse_id: int
    warehouse_name: str
    warehouse_code: str
    available_quantity: int
    reorder_level: int
    shortage: int
    stock_status: str

    model_config = ConfigDict(from_attributes=True)

class InventorySummaryResponse(BaseModel):
    total_products: int
    total_categories: int
    total_warehouses: int
    total_units_in_stock: int
    low_stock_products_count: int
    out_of_stock_products_count: int
    inventory_valuation: Decimal
    categories_breakdown: list[dict] = []
    warehouses_breakdown: list[dict] = []
    recent_movements: list[StockMovementResponse] = []
