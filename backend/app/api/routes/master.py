from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.schemas.customer import CustomerCreate, CustomerOut
from app.schemas.product import ProductCreate, ProductOut

router = APIRouter(prefix="/master", tags=["Master Data"])


# Customers
@router.get("/customers", response_model=List[CustomerOut])
def get_customers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all customers in CRM master database."""
    query = db.query(Customer)
    if search:
        query = query.filter(
            (Customer.name.ilike(f"%{search}%")) |
            (Customer.company_name.ilike(f"%{search}%"))
        )
    return query.order_by(Customer.id.asc()).offset(skip).limit(limit).all()


@router.post("/customers", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new customer to CRM master list."""
    customer = Customer(**customer_in.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


# Products
@router.get("/products", response_model=List[ProductOut])
def get_products(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all products in catalog."""
    query = db.query(Product).filter(Product.is_active == True)
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) |
            (Product.sku.ilike(f"%{search}%"))
        )
    products = query.order_by(Product.id.asc()).offset(skip).limit(limit).all()
    return [
        ProductOut(
            id=product.id,
            sku=product.sku,
            name=product.product_name,
            description=product.description,
            category=product.category.category_name if product.category else "General",
            unit=product.unit,
            unit_price=float(product.selling_price or 0),
            cost_price=float(product.cost_price or 0),
            tax_rate=float(product.tax_percentage or 0),
            stock_quantity=product.total_stock,
            is_active=product.is_active,
            created_at=product.created_at,
        )
        for product in products
    ]


@router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new product to inventory catalog."""
    # Check duplicate SKU
    if db.query(Product).filter(Product.sku == product_in.sku).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with SKU '{product_in.sku}' already exists"
        )
    product = Product(**product_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
