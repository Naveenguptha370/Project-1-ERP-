"""SmartERP - Common Pydantic schemas"""
from pydantic import BaseModel
from typing import Optional, Any


class MessageResponse(BaseModel):
    message: str


class PaginationMeta(BaseModel):
    total: int
    page: int
    per_page: int
    pages: int


class PaginatedResponse(BaseModel):
    data: list[Any]
    meta: PaginationMeta
