# SmartERP — Module 1: Authentication & Security Documentation

## 1. Overview

Module 1 establishes the foundational security, authentication, and access control architecture for SmartERP.

### Key Capabilities:
- **Registration**: Self-service user onboarding with email format verification, username regex validation, password matching, and duplicate prevention.
- **Login**: Fast, secure token generation with bcrypt verification and protection against timing attacks.
- **JWT Authorization**: Stateless Bearer tokens (HS256) embedded with user claims, role definitions, and expiration limits.
- **Role-Based Access Control (RBAC)**: Supports `ADMIN`, `MANAGER`, and `EMPLOYEE` roles with fine-grained permissions.
- **Security Audit Logging**: Every sensitive action is logged with actor identification, IP address, timestamp, and sanitized payload details.

---

## 2. Seed Accounts

| Account Role | Username | Email | Default Password | Access Level |
|---|---|---|---|---|
| **Administrator** | `admin` | `admin@smarterp.com` | `AdminPassword123!` | Full unrestricted access to all modules and user administration |
| **Manager** | `manager` | `manager@smarterp.com` | `ManagerPassword123!` | Operational access, CRM pipeline management, user directory view |
| **Employee** | `employee` | `employee@smarterp.com` | `EmployeePassword123!` | Operational access to CRM records and personal profile |
