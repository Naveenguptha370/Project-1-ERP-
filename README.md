# SmartERP

SmartERP is a modular ERP MVP with authentication, HR, CRM, inventory, sales, procurement, finance, and reporting workflows.

## Modules

| Module | Included workflows |
|---|---|
| Authentication & Security | Register, login, JWT, employee/manager/admin roles, protected API routes, profile, logout, and audit events |
| HR Management | Employees, departments, attendance, and leave requests |
| CRM | Customer directory, lead pipeline, lead conversion, and customer/lead activity history |
| Inventory Management | Products, categories, warehouses, stock levels, stock movements, and low-stock alerts |
| Sales Management | Quotations, sales orders, invoices, payments, and data-backed sales analytics |
| Procurement | Suppliers, purchase orders, order status, goods receipt, and inventory integration |
| Finance | Expense submission and manager/admin review |
| Dashboard & Reports | Cross-module KPIs, sales/inventory/finance reports, and CSV summary export |

## Technology

- React, Vite, Tailwind CSS, React Router, Axios
- FastAPI, SQLAlchemy, Pydantic, Alembic
- SQLite (the project's supported database)
- Pytest and HTTPX

## Setup (Windows)

### Backend

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# For a fresh SQLite database only:
.\.venv\Scripts\python.exe -m alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

The API runs at `http://localhost:8001`; interactive documentation is at `http://localhost:8001/docs`.
For a database created by an earlier SmartERP version, back it up first and do not run the fresh-install Alembic baseline over the existing file. Startup applies only additive compatibility changes and creates missing module tables; existing rows are retained.

### Frontend

In a separate terminal:

```powershell
Set-Location frontend
npm ci
npm run dev
```

The web app runs at `http://localhost:5173`.

### Optional demo inventory data

To add clearly labelled sample categories, products, a warehouse, stock, and movement history to the configured SQLite database, run this once from the repository root. It is safe to rerun and does not delete or replace existing records:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe .\scripts\seed_demo_inventory.py
```

To add a sample customer, quotations, converted order, invoice, and partial payment for the Sales dashboard, first seed the demo inventory and then run:

```powershell
.\.venv\Scripts\python.exe .\scripts\seed_demo_sales.py
```

The sample company and transaction references are labelled as demo data. These records are stored in the local database and are not real customer transactions.

To add example HR departments, employees, today's attendance, and a pending leave request, run:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe .\scripts\seed_demo_hr.py
```

The HR records use demo names, addresses, and contact details and are not real employee records. The script is safe to rerun and does not remove or modify existing HR records.

## Initial administrator and JWT secret

Public registration always assigns the `EMPLOYEE` role. It never accepts a role from the registration request.

To create or reset the initial administrator, set `ADMIN_EMAIL` in `backend/.env`. Run the bootstrap command from `backend`; if `ADMIN_PASSWORD` is absent or shorter than 12 characters, it securely prompts you to enter and confirm a new password:

```powershell
.\.venv\Scripts\python.exe .\scripts\bootstrap_admin.py
```

If `SECRET_KEY` is omitted, the backend generates a random in-memory key when it starts; tokens are invalidated when the server restarts. For persistent sessions, generate a key with:

```powershell
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(48))"
```

Store the generated value in `backend/.env`. Do not commit `.env`, passwords, or the SQLite database file.

## MVP boundaries

Procurement, Finance, and Reports are practical MVP workflows, not a full accounting suite. Finance tracks submitted, approved, and rejected expenses; it does not implement general-ledger accounting, tax filing, bank reconciliation, or supplier invoicing. Receiving a purchase order increases stock at its warehouse and records a stock movement. Reports are calculated from stored database records and show empty/zero values where there is no data.

## Tests

From the repository root:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m pytest -v
```
