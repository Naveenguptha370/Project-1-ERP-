# SmartERP — System Architecture & Design

SmartERP is a modular, high-performance, enterprise-grade Enterprise Resource Planning system built for scalability, security, and clean separation of concerns.

---

## 1. High-Level Modular Design

```
+---------------------------------------------------------------------------------------+
|                                     Frontend                                          |
|                 (React 18 + Vite + Tailwind CSS + Lucide Icons)                       |
+---------------------------------------------------------------------------------------+
                                           |  REST API (JSON + Bearer JWT)
                                           v
+---------------------------------------------------------------------------------------+
|                                  FastAPI Backend                                      |
|  +--------------------+  +--------------------+  +--------------------+               |
|  | Auth & Security    |  | Master Catalog     |  | Audit Trail        |               |
|  | (RBAC, JWT, Bcrypt)|  | (Customers, Products|  | (Activity Logs)    |               |
|  +--------------------+  +--------------------+  +--------------------+               |
|  +--------------------------------------------------------------------+               |
|  |                  MEMBER 5: SALES MODULE                            |               |
|  |  [Quotations]  --->  [Sales Orders]  --->  [Invoices]  ---> [Payments]             |
|  |   - Discount          - Fulfilment          - Net 30/60      - Auto Settlement     |
|  |   - Tax Engine        - Item Reservation    - Aging Track    - Multi-method        |
|  +--------------------------------------------------------------------+               |
+---------------------------------------------------------------------------------------+
                                           |  SQLAlchemy 2.0 ORM
                                           v
+---------------------------------------------------------------------------------------+
|                                Database Layer                                         |
|              PostgreSQL (Production) / SQLite (Zero-Config Dev)                       |
+---------------------------------------------------------------------------------------+
```

---

## 2. Team Module Allocation & Boundary Contracts

| Member | Responsibility | Status | Integration Points with Sales (Member 5) |
|---|---|---|---|
| **Member 1** | Authentication & Security | Functional | Provides JWT authentication tokens, role checks (`ADMIN`, `MANAGER`, `EMPLOYEE`), and audit logger |
| **Member 2** | HR Management | Planned Placeholder | Sales rep commission tracking, sales department employee assignment |
| **Member 3** | CRM | Integrated Master Data | Customer master data, lead-to-quotation conversion |
| **Member 4** | Inventory | Integrated Master Data | Product catalog, pricing, SKU tracking, stock updates upon order fulfillment |
| **Member 5** | **Sales Management** | **FULLY IMPLEMENTED** | **Quotations, Sales Orders, Invoices, Payments, Sales Analytics** |
| **Member 6** | Procurement & Finance | Planned Placeholder | Accounts receivable posted to general ledger; payment receipts matched to bank accounts |
| **Member 7** | Dashboard & Integration | Planned Placeholder | Consumes `/api/v1/sales/analytics/dashboard` for executive enterprise KPI displays |

---

## 3. Technology Choices

- **FastAPI**: Modern, asynchronous, self-documenting (Swagger / OpenAPI 3.0), high throughput.
- **SQLAlchemy 2.0**: Type-safe relational mapper with declarative Base and relationship cascading.
- **Pydantic V2**: Ultra-fast data validation and serialization.
- **React + Vite**: Instant hot reload, modern ECMAScript module bundling.
- **Tailwind CSS**: Enterprise design system with glassmorphism, responsive breakpoints, and rich palettes.
- **Dual Database Engine**:
  - Zero-friction developer onboarding via automatic SQLite fallback.
  - Full production PostgreSQL support configured through `.env`.
