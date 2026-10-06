# SmartERP REST API Reference

Base URL: `http://localhost:8000/api/v1`  
Interactive Swagger Documentation: `http://localhost:8000/docs`  
Interactive ReDoc Documentation: `http://localhost:8000/redoc`

---

## 1. Authentication & Security (Module 1)

### `POST /auth/register`
Register a new employee/user in the system.
- **Request Body**:
  ```json
  {
    "full_name": "Jane Smith",
    "email": "jane.smith@smarterp.com",
    "username": "janesmith",
    "password": "SecurePassword123!",
    "confirm_password": "SecurePassword123!"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "id": 4,
    "full_name": "Jane Smith",
    "email": "jane.smith@smarterp.com",
    "username": "janesmith",
    "role": "EMPLOYEE",
    "roles": ["EMPLOYEE"],
    "permissions": ["AUTH_LOGIN", "AUTH_LOGOUT", "CRM_CUSTOMER_READ", "CRM_LEAD_READ"],
    "is_active": true
  }
  ```

### `POST /auth/login`
Authenticate with credentials and obtain a signed JWT token.
- **Request Body**:
  ```json
  {
    "username_or_email": "admin",
    "password": "AdminPassword123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "expires_in": 7200,
    "user": { ... }
  }
  ```

### `GET /auth/me`
Retrieve the current authenticated user profile and effective permissions.
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
  ```json
  {
    "id": 1,
    "full_name": "System Administrator",
    "email": "admin@smarterp.com",
    "username": "admin",
    "is_active": true,
    "is_superuser": true,
    "role": "ADMIN",
    "roles": ["ADMIN"],
    "permissions": ["AUTH_LOGIN", "USER_CREATE", "CRM_CUSTOMER_CREATE", ...]
  }
  ```

### `POST /auth/logout`
Record security audit log and terminate session.
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**: `{"message": "Logged out successfully"}`

---

## 2. Member 3 — CRM (Customers, Leads, History)

### `GET /crm/overview`
Get comprehensive CRM overview KPIs (Total customers, active leads, pipeline conversion rate, recent activity count).

### `GET /crm/customers`
List enterprise customer accounts with search and status filtering.
- **Query Parameters**:
  - `search`: Filter by name, company, email, customer code
  - `status`: `ACTIVE`, `PROSPECT`, `INACTIVE`, `BLOCKED`
  - `industry`: Industry vertical
  - `skip`, `limit`: Pagination parameters

### `POST /crm/customers`
Create a new customer account record with auto-generated code `CUST-100X`.
- **Request Body**:
  ```json
  {
    "name": "Apex Manufacturing Ltd",
    "company_name": "Apex Global Industries",
    "email": "contact@apexglobal.example.com",
    "phone": "+1 (555) 234-5678",
    "industry": "Manufacturing",
    "customer_type": "ENTERPRISE",
    "status": "ACTIVE",
    "annual_revenue": 1500000.00,
    "credit_limit": 250000.00
  }
  ```

### `GET /crm/customers/{id}`
Retrieve customer details including complete interaction history timeline.

### `GET /crm/leads`
Retrieve sales pipeline opportunities with stage filtering (`NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `NEGOTIATION`, `WON`, `LOST`).

### `POST /crm/leads`
Create a sales lead with qualification score and estimated deal value.

### `POST /crm/leads/{id}/convert`
Convert a qualified sales lead into an active ERP Customer.

### `POST /crm/interactions`
Log a communication event (`CALL`, `EMAIL`, `MEETING`, `NOTE`, `TASK`, `DEAL_UPDATE`) associated with a customer or lead.

---

## 3. Users, Roles & Permissions

- `GET /users` — List system users (Admin/Manager)
- `POST /users` — Create user (Admin only)
- `POST /users/{id}/roles` — Assign roles to user (Admin only)
- `GET /users/access/roles` — List system roles and mapped permissions
- `GET /users/access/permissions` — List all system permission codes

---

## 4. Security Audit Logs

- `GET /audit/logs` — Query immutable security audit events (Admin/Manager)
- `GET /audit/my-logs` — Query personal authentication and security events
