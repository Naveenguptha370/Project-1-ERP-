from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.business import Expense, Lead, PurchaseOrder, Supplier
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.invoice import Invoice
from app.models.inventory import WarehouseStock
from app.models.payment import Payment
from app.models.product import Product
from app.models.sales_order import SalesOrder
from app.models.user import User
from app.models.warehouse import Warehouse

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


def _sum_or_zero(db: Session, expression, *filters) -> float:
    query = db.query(func.coalesce(func.sum(expression), 0))
    for criterion in filters:
        query = query.filter(criterion)
    return float(query.scalar() or 0)


@router.get("/status")
def reports_status(_: User = Depends(get_current_user)):
    return {"module": "Reports & Analytics", "status": "active"}


@router.get("/dashboard")
def dashboard_report(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return {
        "as_of": now.isoformat(),
        "sales": {
            "revenue": _sum_or_zero(db, Invoice.total_amount, Invoice.status.notin_(["Cancelled", "Draft"])),
            "paid": _sum_or_zero(db, Payment.amount, Payment.status == "Completed"),
            "outstanding": _sum_or_zero(db, Invoice.balance_due, Invoice.status.notin_(["Cancelled", "Draft"])),
            "orders": db.query(SalesOrder).filter(SalesOrder.status != "Cancelled").count(),
            "invoices": db.query(Invoice).filter(Invoice.status.notin_(["Cancelled", "Draft"])).count(),
            "revenue_this_month": _sum_or_zero(
                db,
                Invoice.total_amount,
                Invoice.status.notin_(["Cancelled", "Draft"]),
                Invoice.issue_date >= month_start,
            ),
        },
        "crm": {
            "customers": db.query(Customer).count(),
            "open_leads": db.query(Lead).filter(Lead.status.notin_(["Won", "Lost"])).count(),
        },
        "inventory": {
            "products": db.query(Product).filter(Product.is_active.is_(True)).count(),
            "units_on_hand": int(_sum_or_zero(db, WarehouseStock.quantity_on_hand)),
            "stock_value": _inventory_value(db),
        },
        "procurement": {
            "suppliers": db.query(Supplier).filter(Supplier.is_active.is_(True)).count(),
            "open_purchase_orders": db.query(PurchaseOrder).filter(
                PurchaseOrder.status.in_(["Draft", "Ordered"])
            ).count(),
        },
        "finance": {
            "pending_expenses": db.query(Expense).filter(Expense.status == "Submitted").count(),
            "approved_expenses": _sum_or_zero(db, Expense.amount, Expense.status == "Approved"),
        },
        "hr": {
            "employees": db.query(Employee).count(),
            "attendance_today": db.query(Attendance).filter(
                func.date(Attendance.date) == now.date()
            ).count(),
        },
    }


def _inventory_value(db: Session) -> float:
    return float(
        db.query(func.coalesce(func.sum(WarehouseStock.quantity_on_hand * Product.cost_price), 0))
        .join(Product, Product.id == WarehouseStock.product_id)
        .scalar()
        or 0
    )


@router.get("/sales")
def sales_report(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return {
        "revenue": _sum_or_zero(db, Invoice.total_amount, Invoice.status.notin_(["Cancelled", "Draft"])),
        "paid": _sum_or_zero(db, Payment.amount, Payment.status == "Completed"),
        "outstanding": _sum_or_zero(db, Invoice.balance_due, Invoice.status.notin_(["Cancelled", "Draft"])),
        "orders_by_status": [
            {"status": order_status, "count": count}
            for order_status, count in db.query(SalesOrder.status, func.count(SalesOrder.id))
            .group_by(SalesOrder.status)
            .order_by(SalesOrder.status)
            .all()
        ],
    }


@router.get("/inventory")
def inventory_report(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return {
        "products": db.query(Product).filter(Product.is_active.is_(True)).count(),
        "units_on_hand": int(_sum_or_zero(db, WarehouseStock.quantity_on_hand)),
        "stock_value": _inventory_value(db),
        "stock_by_warehouse": [
            {
                "warehouse_id": warehouse_id,
                "warehouse": warehouse_name,
                "units_on_hand": int(units or 0),
                "stock_value": float(value or 0),
            }
            for warehouse_id, warehouse_name, units, value in (
                db.query(
                    WarehouseStock.warehouse_id,
                    Warehouse.warehouse_name,
                    func.sum(WarehouseStock.quantity_on_hand),
                    func.sum(WarehouseStock.quantity_on_hand * Product.cost_price),
                )
                .join(Product, Product.id == WarehouseStock.product_id)
                .join(Warehouse, Warehouse.id == WarehouseStock.warehouse_id)
                .group_by(WarehouseStock.warehouse_id)
                .all()
            )
        ],
    }


@router.get("/finance")
def finance_report(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return {
        "approved_expenses": _sum_or_zero(db, Expense.amount, Expense.status == "Approved"),
        "pending_expenses": _sum_or_zero(db, Expense.amount, Expense.status == "Submitted"),
        "rejected_expenses": _sum_or_zero(db, Expense.amount, Expense.status == "Rejected"),
        "expenses_by_category": [
            {"category": category, "amount": float(amount or 0)}
            for category, amount in db.query(Expense.category, func.sum(Expense.amount))
            .filter(Expense.status == "Approved")
            .group_by(Expense.category)
            .order_by(func.sum(Expense.amount).desc())
            .all()
        ],
    }
