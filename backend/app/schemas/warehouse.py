from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class WarehouseBase(BaseModel):
    warehouse_code: str = Field(..., min_length=2, max_length=50, description="Unique warehouse code (e.g. WH-MAIN)")
    warehouse_name: str = Field(..., min_length=2, max_length=100, description="Warehouse name")
    description: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    is_active: bool = True

    @field_validator("warehouse_code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        v = v.strip().upper()
        if not v:
            raise ValueError("Warehouse code cannot be blank")
        return v

    @field_validator("warehouse_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Warehouse name cannot be blank")
        return v

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    warehouse_code: str | None = Field(None, min_length=2, max_length=50)
    warehouse_name: str | None = Field(None, min_length=2, max_length=100)
    description: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    is_active: bool | None = None

    @field_validator("warehouse_code")
    @classmethod
    def validate_code(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip().upper()
            if not v:
                raise ValueError("Warehouse code cannot be blank")
        return v

    @field_validator("warehouse_name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Warehouse name cannot be blank")
        return v

class WarehouseStockItem(BaseModel):
    product_id: int
    product_name: str
    product_code: str
    sku: str
    unit: str
    category_name: str | None = None
    quantity_on_hand: int
    reserved_quantity: int
    available_quantity: int
    reorder_level: int
    stock_status: str

    model_config = ConfigDict(from_attributes=True)

class WarehouseResponse(WarehouseBase):
    id: int
    total_products_count: int = 0
    total_units_in_stock: int = 0
    low_stock_products_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WarehouseDetailResponse(WarehouseResponse):
    stock_items: list[WarehouseStockItem] = []

class WarehouseListResponse(BaseModel):
    total: int
    items: list[WarehouseResponse]
