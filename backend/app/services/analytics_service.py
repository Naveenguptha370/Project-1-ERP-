from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.product import Product
from app.models.quotation import Quotation
from app.models.sales_order import SalesOrder, SalesOrderItem
from app.schemas.analytics import (
    RecentActivity,
    SalesChartPoint,
    SalesDashboardOut,
    SalesKPIs,
    TopProduct,
)


def get_sales_dashboard_metrics(db: Session) -> SalesDashboardOut:
    invoices = db.query(Invoice).all()
    valid_invoices = [
        invoice for invoice in invoices if invoice.status not in {"Cancelled", "Draft"}
    ]
    total_revenue = sum(float(invoice.total_amount or 0) for invoice in valid_invoices)
    total_paid = sum(float(invoice.amount_paid or 0) for invoice in valid_invoices)
    total_outstanding = sum(float(invoice.balance_due or 0) for invoice in valid_invoices)

    quotations_count = db.query(Quotation).count()
    orders_count = db.query(SalesOrder).count()
    invoices_count = len(valid_invoices)
    payments_count = db.query(Payment).filter(Payment.status == "Completed").count()
    accepted_quotes = db.query(Quotation).filter(
        (Quotation.status == "Accepted") | (Quotation.sales_order_id.isnot(None))
    ).count()
    conversion_rate = round(accepted_quotes / quotations_count * 100, 1) if quotations_count else 0.0

    kpis = SalesKPIs(
        total_revenue=round(total_revenue, 2),
        total_outstanding=round(total_outstanding, 2),
        total_paid=round(total_paid, 2),
        quotations_count=quotations_count,
        orders_count=orders_count,
        invoices_count=invoices_count,
        payments_count=payments_count,
        conversion_rate=conversion_rate,
    )

    now = datetime.now(timezone.utc)
    month_index = now.year * 12 + now.month - 1
    months = []
    for offset in reversed(range(6)):
        index = month_index - offset
        year, zero_based_month = divmod(index, 12)
        month = zero_based_month + 1
        months.append({
            "key": (year, month),
            "month": datetime(year, month, 1).strftime("%b %Y"),
            "quotations": 0.0,
            "orders": 0.0,
            "invoiced": 0.0,
            "collected": 0.0,
        })
    month_lookup = {month["key"]: month for month in months}

    for quotation in db.query(Quotation).all():
        if quotation.issue_date:
            bucket = month_lookup.get((quotation.issue_date.year, quotation.issue_date.month))
            if bucket:
                bucket["quotations"] += float(quotation.total_amount or 0)
    for order in db.query(SalesOrder).filter(SalesOrder.status != "Cancelled").all():
        if order.order_date:
            bucket = month_lookup.get((order.order_date.year, order.order_date.month))
            if bucket:
                bucket["orders"] += float(order.total_amount or 0)
    for invoice in valid_invoices:
        if invoice.issue_date:
            bucket = month_lookup.get((invoice.issue_date.year, invoice.issue_date.month))
            if bucket:
                bucket["invoiced"] += float(invoice.total_amount or 0)
    for payment in db.query(Payment).filter(Payment.status == "Completed").all():
        if payment.payment_date:
            bucket = month_lookup.get((payment.payment_date.year, payment.payment_date.month))
            if bucket:
                bucket["collected"] += float(payment.amount or 0)

    monthly_trends = [
        SalesChartPoint(**{key: value for key, value in month.items() if key != "key"})
        for month in months
    ]

    top_products_query = (
        db.query(
            SalesOrderItem.product_name,
            Product.sku,
            func.sum(SalesOrderItem.quantity).label("units_sold"),
            func.sum(SalesOrderItem.total_amount).label("total_sales"),
        )
        .outerjoin(Product, Product.id == SalesOrderItem.product_id)
        .join(SalesOrder, SalesOrder.id == SalesOrderItem.sales_order_id)
        .filter(SalesOrder.status != "Cancelled")
        .group_by(SalesOrderItem.product_name, Product.sku)
        .order_by(func.sum(SalesOrderItem.total_amount).desc())
        .limit(5)
        .all()
    )
    top_products = [
        TopProduct(
            name=row.product_name,
            sku=row.sku or "—",
            units_sold=float(row.units_sold or 0),
            total_sales=float(row.total_sales or 0),
        )
        for row in top_products_query
    ]

    recent = []
    for payment in db.query(Payment).order_by(Payment.id.desc()).limit(5).all():
        recent.append((payment.payment_date, RecentActivity(
            id=f"pay-{payment.id}",
            type="Payment",
            number=payment.payment_number,
            customer=payment.customer_name,
            amount=float(payment.amount or 0),
            status=payment.status,
            date=payment.payment_date.strftime("%Y-%m-%d") if payment.payment_date else "—",
        )))
    for invoice in db.query(Invoice).order_by(Invoice.id.desc()).limit(5).all():
        recent.append((invoice.issue_date, RecentActivity(
            id=f"inv-{invoice.id}",
            type="Invoice",
            number=invoice.invoice_number,
            customer=invoice.customer_name,
            amount=float(invoice.total_amount or 0),
            status=invoice.status,
            date=invoice.issue_date.strftime("%Y-%m-%d") if invoice.issue_date else "—",
        )))
    for order in db.query(SalesOrder).order_by(SalesOrder.id.desc()).limit(5).all():
        recent.append((order.order_date, RecentActivity(
            id=f"so-{order.id}",
            type="Order",
            number=order.order_number,
            customer=order.customer_name,
            amount=float(order.total_amount or 0),
            status=order.status,
            date=order.order_date.strftime("%Y-%m-%d") if order.order_date else "—",
        )))
    recent.sort(key=lambda entry: entry[0].isoformat() if entry[0] else "", reverse=True)

    return SalesDashboardOut(
        kpis=kpis,
        monthly_trends=monthly_trends,
        top_products=top_products,
        recent_activities=[activity for _, activity in recent[:8]],
    )
