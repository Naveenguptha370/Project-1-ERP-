from typing import List, Optional
from pydantic import BaseModel


class SalesKPIs(BaseModel):
    total_revenue: float
    total_outstanding: float
    total_paid: float
    quotations_count: int
    orders_count: int
    invoices_count: int
    payments_count: int
    conversion_rate: float


class SalesChartPoint(BaseModel):
    month: str
    quotations: float
    orders: float
    invoiced: float
    collected: float


class TopProduct(BaseModel):
    name: str
    sku: str
    units_sold: float
    total_sales: float


class RecentActivity(BaseModel):
    id: str
    type: str  # Quotation, Order, Invoice, Payment
    number: str
    customer: str
    amount: float
    status: str
    date: str


class SalesDashboardOut(BaseModel):
    kpis: SalesKPIs
    monthly_trends: List[SalesChartPoint]
    top_products: List[TopProduct]
    recent_activities: List[RecentActivity]
