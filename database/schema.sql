-- SmartERP Complete PostgreSQL Database Schema
-- Collaborative Enterprise Resource Planning System
-- Authentication & Security, HR, Inventory, and Sales Modules

-- ============================================================================
-- 1. AUTHENTICATION & SECURITY MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    code VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(100) DEFAULT 'CORE',
    description VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_superuser BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    details TEXT,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- ============================================================================
-- 2. INVENTORY MANAGEMENT MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    category_code VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_categories_code ON categories(category_code);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(category_name);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    product_name VARCHAR(150) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
    unit VARCHAR(30) DEFAULT 'pcs' NOT NULL,
    cost_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    selling_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    tax_percentage NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    reorder_level INTEGER DEFAULT 10 NOT NULL,
    minimum_stock_level INTEGER DEFAULT 5 NOT NULL,
    maximum_stock_level INTEGER DEFAULT 1000 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    warehouse_code VARCHAR(50) UNIQUE NOT NULL,
    warehouse_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_warehouses_code ON warehouses(warehouse_code);
CREATE INDEX IF NOT EXISTS idx_warehouses_name ON warehouses(warehouse_name);

CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity_on_hand INTEGER DEFAULT 0 NOT NULL,
    reserved_quantity INTEGER DEFAULT 0 NOT NULL,
    available_quantity INTEGER DEFAULT 0 NOT NULL,
    reorder_level INTEGER DEFAULT 10 NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_product_warehouse UNIQUE (product_id, warehouse_id)
);
CREATE INDEX IF NOT EXISTS idx_inv_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_warehouse_id ON inventory(warehouse_id);

CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    movement_type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    source_warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
    destination_warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
    reference_type VARCHAR(50),
    reference_id VARCHAR(100),
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_movements_created ON stock_movements(created_at);

-- ============================================================================
-- 3. SALES MANAGEMENT MODULE (MEMBER 5)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    company_name VARCHAR(150),
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    tax_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotations (
    id SERIAL PRIMARY KEY,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(100),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Draft',
    subtotal NUMERIC(12, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) DEFAULT 0.00,
    notes TEXT,
    terms TEXT,
    sales_order_id INTEGER,
    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE NOT NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    quantity NUMERIC(10, 2) DEFAULT 1.00,
    unit_price NUMERIC(12, 2) DEFAULT 0.00,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 18.00,
    total_amount NUMERIC(12, 2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS sales_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    quotation_id INTEGER REFERENCES quotations(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(100),
    customer_phone VARCHAR(50),
    shipping_address TEXT,
    billing_address TEXT,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Draft',
    subtotal NUMERIC(12, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) DEFAULT 0.00,
    invoice_id INTEGER,
    notes TEXT,
    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_order_items (
    id SERIAL PRIMARY KEY,
    sales_order_id INTEGER REFERENCES sales_orders(id) ON DELETE CASCADE NOT NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    quantity NUMERIC(10, 2) DEFAULT 1.00,
    unit_price NUMERIC(12, 2) DEFAULT 0.00,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 18.00,
    total_amount NUMERIC(12, 2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    sales_order_id INTEGER REFERENCES sales_orders(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(100),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Unpaid',
    subtotal NUMERIC(12, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) DEFAULT 0.00,
    amount_paid NUMERIC(12, 2) DEFAULT 0.00,
    balance_due NUMERIC(12, 2) DEFAULT 0.00,
    notes TEXT,
    payment_terms VARCHAR(100) DEFAULT 'Due in 30 days',
    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    quantity NUMERIC(10, 2) DEFAULT 1.00,
    unit_price NUMERIC(12, 2) DEFAULT 0.00,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 18.00,
    total_amount NUMERIC(12, 2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
    reference_number VARCHAR(100),
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Completed',
    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotations_quote_number ON quotations(quote_number);
CREATE INDEX IF NOT EXISTS idx_sales_orders_order_number ON sales_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_payments_payment_number ON payments(payment_number);

-- ============================================================================
-- 4. HR MANAGEMENT MODULE (MEMBER 2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    job_title VARCHAR(100),
    date_of_joining DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'PRESENT' NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS leaves (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
