"""SmartERP - API Router Registry"""
from fastapi import APIRouter
from app.api.routes import auth, departments, employees, attendance, leaves

api_router = APIRouter(prefix="/api/v1")

# Member 1 (Auth) — stub
api_router.include_router(auth.router)

# Member 2 (HR Management)
api_router.include_router(departments.router)
api_router.include_router(employees.router)
api_router.include_router(attendance.router)
api_router.include_router(leaves.router)

# Placeholders — other members will add their routers here
# api_router.include_router(crm.router)       # Member 3
# api_router.include_router(inventory.router) # Member 4
# api_router.include_router(sales.router)     # Member 5
# api_router.include_router(procurement.router) # Member 6
# api_router.include_router(dashboard.router) # Member 7
