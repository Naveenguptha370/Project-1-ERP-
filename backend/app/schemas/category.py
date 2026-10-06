from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CategoryBase(BaseModel):
    category_code: str = Field(..., min_length=2, max_length=50, description="Unique category code (e.g. CAT-ELEC)")
    category_name: str = Field(..., min_length=2, max_length=100, description="Category name")
    description: str | None = None
    parent_category_id: int | None = None
    is_active: bool = True

    @field_validator("category_code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        v = v.strip().upper()
        if not v:
            raise ValueError("Category code cannot be blank")
        return v

    @field_validator("category_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Category name cannot be blank")
        return v

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    category_code: str | None = Field(None, min_length=2, max_length=50)
    category_name: str | None = Field(None, min_length=2, max_length=100)
    description: str | None = None
    parent_category_id: int | None = None
    is_active: bool | None = None

    @field_validator("category_code")
    @classmethod
    def validate_code(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip().upper()
            if not v:
                raise ValueError("Category code cannot be blank")
        return v

    @field_validator("category_name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Category name cannot be blank")
        return v

class CategoryResponse(CategoryBase):
    id: int
    product_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CategoryListResponse(BaseModel):
    total: int
    items: list[CategoryResponse]
