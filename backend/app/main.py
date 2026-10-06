from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, crm, finance, master, procurement, reports, sales, users
from app.api.routes import hr
from app.api.routes import attendance, departments, employees, leaves
from app.core.config import settings
from app.database import Base, SessionLocal, engine
from app.database.legacy_compat import upgrade_legacy_sqlite_schema
import app.database.base  # noqa: F401 - register all ORM models before creating tables
from app.routers import categories, inventory, products, warehouses
from app.routers.auth import ensure_default_roles_and_permissions


@asynccontextmanager
async def lifespan(app: FastAPI):
    upgrade_legacy_sqlite_schema(engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        ensure_default_roles_and_permissions(db)
        db.commit()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SmartERP with authentication, HR, CRM, inventory, sales, procurement, finance, and reporting.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(
        set(settings.BACKEND_CORS_ORIGINS)
        | {"http://localhost:5174", "http://127.0.0.1:5174"}
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_v1_prefix = settings.API_V1_STR

for route in (
    auth.router,
    users.router,
    sales.router,
    master.router,
    departments.router,
    employees.router,
    attendance.router,
    leaves.router,
    categories.router,
    products.router,
    warehouses.router,
    inventory.router,
    crm.router,
    procurement.router,
    finance.router,
    reports.router,
):
    app.include_router(route, prefix=api_v1_prefix)


@app.get("/", tags=["Health"])
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "Online",
        "docs": "/docs",
        "modules": {
            "auth": f"{api_v1_prefix}/auth",
            "hr": f"{api_v1_prefix}/employees",
            "crm": f"{api_v1_prefix}/crm",
            "inventory": f"{api_v1_prefix}/inventory",
            "sales": f"{api_v1_prefix}/sales",
            "procurement": f"{api_v1_prefix}/procurement",
            "finance": f"{api_v1_prefix}/finance",
            "reports": f"{api_v1_prefix}/reports",
        },
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}
