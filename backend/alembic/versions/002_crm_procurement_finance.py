"""add CRM, procurement, and finance MVP tables

Revision ID: 002_business_modules
Revises: 001_initial_schema
Create Date: 2026-10-11
"""
import sqlalchemy as sa
from alembic import op

revision = "002_business_modules"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "crm_leads",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("company_name", sa.String(150)),
        sa.Column("email", sa.String(255)),
        sa.Column("phone", sa.String(50)),
        sa.Column("source", sa.String(80)),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("estimated_value", sa.Numeric(12, 2), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("assigned_to_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("converted_customer_id", sa.Integer(), sa.ForeignKey("customers.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_crm_leads_name", "crm_leads", ["name"])
    op.create_index("ix_crm_leads_email", "crm_leads", ["email"])
    op.create_index("ix_crm_leads_status", "crm_leads", ["status"])
    op.create_index("ix_crm_leads_id", "crm_leads", ["id"])

    op.create_table(
        "crm_activities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customers.id", ondelete="CASCADE")),
        sa.Column("lead_id", sa.Integer(), sa.ForeignKey("crm_leads.id", ondelete="CASCADE")),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("action", sa.String(80), nullable=False),
        sa.Column("details", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_crm_activities_customer_id", "crm_activities", ["customer_id"])
    op.create_index("ix_crm_activities_lead_id", "crm_activities", ["lead_id"])
    op.create_index("ix_crm_activities_created_at", "crm_activities", ["created_at"])
    op.create_index("ix_crm_activities_id", "crm_activities", ["id"])

    op.create_table(
        "suppliers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("supplier_code", sa.String(50), nullable=False),
        sa.Column("company_name", sa.String(150), nullable=False),
        sa.Column("contact_name", sa.String(120)),
        sa.Column("email", sa.String(255)),
        sa.Column("phone", sa.String(50)),
        sa.Column("address", sa.Text()),
        sa.Column("tax_id", sa.String(60)),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_suppliers_supplier_code", "suppliers", ["supplier_code"], unique=True)
    op.create_index("ix_suppliers_company_name", "suppliers", ["company_name"])
    op.create_index("ix_suppliers_email", "suppliers", ["email"])
    op.create_index("ix_suppliers_id", "suppliers", ["id"])

    op.create_table(
        "purchase_orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_number", sa.String(50), nullable=False),
        sa.Column("supplier_id", sa.Integer(), sa.ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("warehouse_id", sa.Integer(), sa.ForeignKey("warehouses.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("order_date", sa.DateTime(), nullable=False),
        sa.Column("expected_date", sa.DateTime()),
        sa.Column("received_at", sa.DateTime()),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False),
        sa.Column("tax_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
    )
    op.create_index("ix_purchase_orders_order_number", "purchase_orders", ["order_number"], unique=True)
    op.create_index("ix_purchase_orders_supplier_id", "purchase_orders", ["supplier_id"])
    op.create_index("ix_purchase_orders_status", "purchase_orders", ["status"])
    op.create_index("ix_purchase_orders_id", "purchase_orders", ["id"])

    op.create_table(
        "purchase_order_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("purchase_order_id", sa.Integer(), sa.ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("product_name", sa.String(150), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_cost", sa.Numeric(12, 2), nullable=False),
        sa.Column("tax_rate", sa.Numeric(5, 2), nullable=False),
        sa.Column("line_total", sa.Numeric(12, 2), nullable=False),
    )
    op.create_index("ix_purchase_order_items_id", "purchase_order_items", ["id"])

    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("expense_number", sa.String(50), nullable=False),
        sa.Column("category", sa.String(80), nullable=False),
        sa.Column("description", sa.String(255), nullable=False),
        sa.Column("vendor", sa.String(150)),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("expense_date", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("payment_method", sa.String(50)),
        sa.Column("reference_number", sa.String(100)),
        sa.Column("notes", sa.Text()),
        sa.Column("review_note", sa.Text()),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("reviewed_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("reviewed_at", sa.DateTime()),
    )
    op.create_index("ix_expenses_expense_number", "expenses", ["expense_number"], unique=True)
    op.create_index("ix_expenses_category", "expenses", ["category"])
    op.create_index("ix_expenses_status", "expenses", ["status"])
    op.create_index("ix_expenses_id", "expenses", ["id"])


def downgrade() -> None:
    op.drop_table("expenses")
    op.drop_table("purchase_order_items")
    op.drop_table("purchase_orders")
    op.drop_table("suppliers")
    op.drop_table("crm_activities")
    op.drop_table("crm_leads")
