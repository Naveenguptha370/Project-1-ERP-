
from app.database import get_db
from app.dependencies import require_permission
from app.models.category import Category
from app.models.product import Product
from app.models.user import User
from app.schemas.category import (
    CategoryCreate,
    CategoryListResponse,
    CategoryResponse,
    CategoryUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

router = APIRouter(prefix="/categories", tags=["Inventory — Categories"])

@router.get("", response_model=CategoryListResponse)
def get_categories(
    search: str | None = Query(None, description="Search by name or code"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.view"))
):
    query = db.query(Category)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (Category.category_name.ilike(search_fmt)) |
            (Category.category_code.ilike(search_fmt))
        )
    if is_active is not None:
        query = query.filter(Category.is_active == is_active)

    total = query.count()
    categories = query.order_by(Category.category_name.asc()).offset(skip).limit(limit).all()

    items = []
    for cat in categories:
        p_count = db.query(Product).filter(Product.category_id == cat.id).count() if 'products' in dir(Category) else 0
        cat_resp = CategoryResponse(
            id=cat.id,
            category_code=cat.category_code,
            category_name=cat.category_name,
            description=cat.description,
            parent_category_id=cat.parent_category_id,
            is_active=cat.is_active,
            product_count=p_count,
            created_at=cat.created_at,
            updated_at=cat.updated_at
        )
        items.append(cat_resp)

    return CategoryListResponse(total=total, items=items)

@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.view"))
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    p_count = db.query(Product).filter(Product.category_id == category.id).count()
    return CategoryResponse(
        id=category.id,
        category_code=category.category_code,
        category_name=category.category_name,
        description=category.description,
        parent_category_id=category.parent_category_id,
        is_active=category.is_active,
        product_count=p_count,
        created_at=category.created_at,
        updated_at=category.updated_at
    )

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.category.create"))
):
    # Check for duplicate code
    if db.query(Category).filter(Category.category_code == payload.category_code).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category with code '{payload.category_code}' already exists"
        )
    # Check for duplicate name
    if db.query(Category).filter(func.lower(Category.category_name) == payload.category_name.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category with name '{payload.category_name}' already exists"
        )

    # Check parent category if specified
    if payload.parent_category_id:
        parent = db.query(Category).filter(Category.id == payload.parent_category_id).first()
        if not parent:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent category does not exist")

    category = Category(
        category_code=payload.category_code,
        category_name=payload.category_name,
        description=payload.description,
        parent_category_id=payload.parent_category_id,
        is_active=payload.is_active
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    return CategoryResponse(
        id=category.id,
        category_code=category.category_code,
        category_name=category.category_name,
        description=category.description,
        parent_category_id=category.parent_category_id,
        is_active=category.is_active,
        product_count=0,
        created_at=category.created_at,
        updated_at=category.updated_at
    )

@router.put("/{category_id}", response_model=CategoryResponse)
@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.category.update"))
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if payload.category_code and payload.category_code != category.category_code:
        conflict = db.query(Category).filter(
            Category.category_code == payload.category_code,
            Category.id != category_id
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Category with code '{payload.category_code}' already exists"
            )
        category.category_code = payload.category_code

    if payload.category_name and payload.category_name != category.category_name:
        conflict = db.query(Category).filter(
            func.lower(Category.category_name) == payload.category_name.lower(),
            Category.id != category_id
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Category with name '{payload.category_name}' already exists"
            )
        category.category_name = payload.category_name

    if payload.description is not None:
        category.description = payload.description

    if payload.parent_category_id is not None:
        if payload.parent_category_id == category.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category cannot be its own parent")
        parent = db.query(Category).filter(Category.id == payload.parent_category_id).first()
        if not parent:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent category does not exist")
        category.parent_category_id = payload.parent_category_id

    if payload.is_active is not None:
        category.is_active = payload.is_active

    db.commit()
    db.refresh(category)

    p_count = db.query(Product).filter(Product.category_id == category.id).count()
    return CategoryResponse(
        id=category.id,
        category_code=category.category_code,
        category_name=category.category_name,
        description=category.description,
        parent_category_id=category.parent_category_id,
        is_active=category.is_active,
        product_count=p_count,
        created_at=category.created_at,
        updated_at=category.updated_at
    )

@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
def delete_category(
    category_id: int,
    deactivate_if_has_products: bool = Query(False, description="Safely deactivate instead if category has products"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.category.delete"))
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    # Safe deletion check: cannot delete if products are assigned
    product_count = db.query(Product).filter(Product.category_id == category_id).count()
    if product_count > 0:
        if deactivate_if_has_products:
            category.is_active = False
            db.commit()
            return {
                "message": f"Category contains {product_count} products and was safely deactivated.",
                "action": "deactivated",
                "id": category_id
            }
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category cannot be deleted because products are assigned to it."
        )

    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully", "action": "deleted", "id": category_id}
