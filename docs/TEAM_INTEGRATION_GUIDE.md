# Team Integration Guide — Connecting with Member 5 (Sales)

This guide documents how other module owners integrate with Member 5's Sales architecture.

---

## 1. Member 1: Authentication & Security
- **Endpoints Used**: `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/me`.
- **JWT Format**: Standard `Authorization: Bearer <token>` in HTTP headers.
- **Roles**: All Sales endpoints verify permissions using FastAPI dependencies:
  - `ADMIN`: Full access to all sales data, audit logs, and status overrides.
  - `MANAGER`: Can approve quotations, release shipments, and register payments.
  - `EMPLOYEE`: Can generate quotations and create draft orders.

---

## 2. Member 3: CRM (Customers & Leads)
- **Integration**: Member 3 provides customer accounts and contacts.
- **Foreign Key**:
  - `quotations.customer_id -> customers.id`
  - `sales_orders.customer_id -> customers.id`
  - `invoices.customer_id -> customers.id`
- **Lead Conversion**: When Member 3 marks a Lead as `Won`, they can call:
  `POST /api/v1/sales/quotations` with the lead's contact details to generate the preliminary proposal.

---

## 3. Member 4: Inventory & Warehousing
- **Integration**: Quotations and Sales Orders reference inventory items:
  - `quotation_items.product_id -> products.id`
  - `sales_order_items.product_id -> products.id`
- **Stock Decrement Hook**:
  When a Sales Order transitions to `status = 'Shipped'`, Member 4's inventory service can subscribe to the order event to record a stock-out movement:
  ```python
  # In Member 4 inventory_service:
  def on_order_shipped(order: SalesOrder):
      for item in order.items:
          if item.product_id:
              decrement_stock(item.product_id, item.quantity)
  ```

---

## 4. Member 6: Finance & Accounting
- **Integration**: Member 5's Invoices and Payments trigger General Ledger journal entries:
  - When an invoice is created: Debit Accounts Receivable, Credit Sales Revenue & Tax Payable.
  - When a payment is recorded via `/api/v1/sales/payments`: Debit Cash/Bank Account, Credit Accounts Receivable.

---

## 5. Member 7: Executive Dashboard
- **Integration**: Member 7 can call:
  `GET /api/v1/sales/analytics/dashboard`
  to fetch ready-to-render KPI summaries, revenue metrics, monthly charts, and pipeline conversion data.
