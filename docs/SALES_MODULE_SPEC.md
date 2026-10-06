# Member 5 — Sales Module Specification

## Overview

The Sales Module encompasses the end-to-end commercial transaction lifecycle in SmartERP:
1. **Quotations (Estimates / Proposals)**
2. **Sales Orders (Confirmed Deals / Bookings)**
3. **Commercial Invoices (Receivables)**
4. **Payments & Receipts (Settlements)**
5. **Real-Time Analytics & Financial Pipeline Reporting**

---

## 1. Lifecycle State Machine

```
   +------------------+
   |    QUOTATION     |  Draft -> Sent -> Accepted -> [Converted to Order]
   +------------------+                   |
                                          v
   +------------------+
   |   SALES ORDER    |  Draft -> Confirmed -> Processing -> Shipped -> Delivered
   +------------------+                                                    |
                                                                           v [Converted to Invoice]
   +------------------+
   |     INVOICE      |  Unpaid -> Partially Paid -> Paid (or Overdue)
   +------------------+                              ^
                                                     |
   +------------------+                              | (Auto-balance settlement)
   |     PAYMENT      |  Recorded against Invoice ---+
   +------------------+
```

---

## 2. Mathematical Calculations

For every line item:
$$\text{Line Base} = \text{Quantity} \times \text{Unit Price}$$
$$\text{Discount Amount} = \text{Line Base} \times \left(\frac{\text{Discount \%}}{100}\right)$$
$$\text{Tax Amount} = (\text{Line Base} - \text{Discount Amount}) \times \left(\frac{\text{Tax \%}}{100}\right)$$
$$\text{Line Total} = (\text{Line Base} - \text{Discount Amount}) + \text{Tax Amount}$$

For the document:
$$\text{Subtotal} = \sum \text{Line Base}$$
$$\text{Total Discount} = \sum \text{Discount Amount}$$
$$\text{Total Tax} = \sum \text{Tax Amount}$$
$$\text{Total Amount} = \text{Subtotal} - \text{Total Discount} + \text{Total Tax}$$

When a payment of $P$ is logged against an invoice:
$$\text{New Amount Paid} = \text{Current Amount Paid} + P$$
$$\text{New Balance Due} = \max(0, \text{Total Amount} - \text{New Amount Paid})$$
$$\text{Status} = \begin{cases} \text{Paid} & \text{if Balance Due} \le 0.01 \\ \text{Partially Paid} & \text{if } 0.01 < \text{Balance Due} < \text{Total Amount} \\ \text{Unpaid} & \text{if Balance Due} = \text{Total Amount} \end{cases}$$

---

## 3. Endpoints Implemented

### Quotations
- `GET /api/v1/sales/quotations` — Filter by status, search by number or customer
- `POST /api/v1/sales/quotations` — Create quotation with line items
- `GET /api/v1/sales/quotations/{id}` — Single quotation details
- `PATCH /api/v1/sales/quotations/{id}/status` — Status transition
- `POST /api/v1/sales/quotations/{id}/convert-to-order` — Convert to Sales Order
- `DELETE /api/v1/sales/quotations/{id}` — Delete quotation

### Sales Orders
- `GET /api/v1/sales/orders` — List orders
- `POST /api/v1/sales/orders` — Create order directly
- `GET /api/v1/sales/orders/{id}` — View order details
- `PATCH /api/v1/sales/orders/{id}/status` — Status transition (Draft, Confirmed, Processing, Shipped, Delivered)
- `POST /api/v1/sales/orders/{id}/convert-to-invoice` — Generate commercial invoice
- `DELETE /api/v1/sales/orders/{id}` — Delete order

### Invoices
- `GET /api/v1/sales/invoices` — List invoices
- `POST /api/v1/sales/invoices` — Create standalone invoice
- `GET /api/v1/sales/invoices/{id}` — Invoice breakdown
- `PATCH /api/v1/sales/invoices/{id}/status` — Update status
- `DELETE /api/v1/sales/invoices/{id}` — Delete unpaid invoice

### Payments
- `GET /api/v1/sales/payments` — Payment ledger & receipts
- `POST /api/v1/sales/payments` — Record payment & auto-settle invoice
- `GET /api/v1/sales/payments/{id}` — View payment receipt

### Analytics
- `GET /api/v1/sales/analytics/dashboard` — High level KPIs, monthly trends, top products, recent activity
