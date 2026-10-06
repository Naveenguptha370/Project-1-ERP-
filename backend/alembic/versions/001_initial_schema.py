"""initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-06 11:30:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Permissions
    op.create_table(
        'permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=100), nullable=False),
        sa.Column('module', sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index('idx_permissions_code', 'permissions', ['code'], unique=True)

    # 2. Roles
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # 3. Users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username')
    )
    op.create_index('idx_users_email', 'users', ['email'], unique=True)
    op.create_index('idx_users_username', 'users', ['username'], unique=True)

    # 4. Association user_roles
    op.create_table(
        'user_roles',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'role_id')
    )

    # 5. Association role_permissions
    op.create_table(
        'role_permissions',
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('role_id', 'permission_id')
    )

    # 6. Audit Logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_audit_logs_timestamp', 'audit_logs', ['timestamp'])
    op.create_index('idx_audit_logs_user_id', 'audit_logs', ['user_id'])

    # 7. Categories
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('category_code', sa.String(length=50), nullable=False),
        sa.Column('category_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parent_category_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['parent_category_id'], ['categories.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('category_code'),
        sa.UniqueConstraint('category_name')
    )
    op.create_index('idx_categories_code', 'categories', ['category_code'], unique=True)
    op.create_index('idx_categories_name', 'categories', ['category_name'], unique=True)

    # 8. Products
    op.create_table(
        'products',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_code', sa.String(length=50), nullable=False),
        sa.Column('sku', sa.String(length=50), nullable=False),
        sa.Column('barcode', sa.String(length=100), nullable=True),
        sa.Column('product_name', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('unit', sa.String(length=30), nullable=False, server_default='pcs'),
        sa.Column('cost_price', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('selling_price', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'),
        sa.Column('tax_percentage', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0.00'),
        sa.Column('reorder_level', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('minimum_stock_level', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('maximum_stock_level', sa.Integer(), nullable=False, server_default='1000'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('product_code'),
        sa.UniqueConstraint('sku'),
        sa.UniqueConstraint('barcode')
    )
    op.create_index('idx_products_code', 'products', ['product_code'], unique=True)
    op.create_index('idx_products_sku', 'products', ['sku'], unique=True)
    op.create_index('idx_products_category', 'products', ['category_id'])

    # 9. Warehouses
    op.create_table(
        'warehouses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('warehouse_code', sa.String(length=50), nullable=False),
        sa.Column('warehouse_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('address', sa.String(length=255), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('postal_code', sa.String(length=20), nullable=True),
        sa.Column('contact_person', sa.String(length=100), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('warehouse_code'),
        sa.UniqueConstraint('warehouse_name')
    )
    op.create_index('idx_warehouses_code', 'warehouses', ['warehouse_code'], unique=True)

    # 10. Inventory (Warehouse Stock)
    op.create_table(
        'inventory',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('warehouse_id', sa.Integer(), nullable=False),
        sa.Column('quantity_on_hand', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reserved_quantity', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('available_quantity', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reorder_level', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('last_updated', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('product_id', 'warehouse_id', name='uq_product_warehouse')
    )
    op.create_index('idx_inv_product_id', 'inventory', ['product_id'])
    op.create_index('idx_inv_warehouse_id', 'inventory', ['warehouse_id'])

    # 11. Stock Movements
    op.create_table(
        'stock_movements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('warehouse_id', sa.Integer(), nullable=False),
        sa.Column('movement_type', sa.String(length=50), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('quantity_before', sa.Integer(), nullable=False),
        sa.Column('quantity_after', sa.Integer(), nullable=False),
        sa.Column('source_warehouse_id', sa.Integer(), nullable=True),
        sa.Column('destination_warehouse_id', sa.Integer(), nullable=True),
        sa.Column('reference_type', sa.String(length=50), nullable=True),
        sa.Column('reference_id', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['destination_warehouse_id'], ['warehouses.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['source_warehouse_id'], ['warehouses.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_movements_created', 'stock_movements', ['created_at'])
    op.create_index('idx_movements_product', 'stock_movements', ['product_id'])
    op.create_index('idx_movements_warehouse', 'stock_movements', ['warehouse_id'])

def downgrade() -> None:
    op.drop_table('stock_movements')
    op.drop_table('inventory')
    op.drop_table('warehouses')
    op.drop_table('products')
    op.drop_table('categories')
    op.drop_table('audit_logs')
    op.drop_table('role_permissions')
    op.drop_table('user_roles')
    op.drop_table('users')
    op.drop_table('roles')
    op.drop_table('permissions')
