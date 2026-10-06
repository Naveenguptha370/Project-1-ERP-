
from app.database import get_db
from app.dependencies import require_permission
from app.models.category import Category
from app.models.product import Product
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
    WarehouseStockSummary,
)
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/products", tags=["Inventory — Products"])

def build_product_response(product: Product, db: Session) -> ProductResponse:
    # Warehouse stock breakdown
    warehouses_stock = []
    if hasattr(product, 'inventory_items') and product.inventory_items:
        for item in product.inventory_items:
            warehouses_stock.append(WarehouseStockSummary(
                warehouse_id=item.warehouse_id,
                warehouse_name=item.warehouse.warehouse_name if item.warehouse else f"Warehouse #{item.warehouse_id}",
                warehouse_code=item.warehouse.warehouse_code if item.warehouse else f"WH-{item.warehouse_id}",
                quantity_on_hand=item.quantity_on_hand,
                reserved_quantity=item.reserved_quantity,
                available_quantity=item.available_quantity
            ))

    total_stock = sum(w.available_quantity for w in warehouses_stock)
    
    # Stock status computation
    if total_stock <= 0:
        stock_status = "OUT OF STOCK"
    elif total_stock <= product.reorder_level:
        stock_status = "LOW STOCK"
    else:
        stock_status = "IN STOCK"

    return ProductResponse(
        id=product.id,
        product_code=product.product_code,
        sku=product.sku,
        barcode=product.barcode,
        product_name=product.product_name,
        description=product.description,
        category_id=product.category_id,
        category_name=product.category.category_name if product.category else None,
        unit=product.unit,
        cost_price=product.cost_price,
        selling_price=product.selling_price,
        tax_percentage=product.tax_percentage,
        reorder_level=product.reorder_level,
        minimum_stock_level=product.minimum_stock_level,
        maximum_stock_level=product.maximum_stock_level,
        is_active=product.is_active,
        total_stock=total_stock,
        stock_status=stock_status,
        created_by=product.created_by,
        created_at=product.created_at,
        updated_at=product.updated_at,
        warehouses_stock=warehouses_stock
    )

@router.get("", response_model=ProductListResponse)
def get_products(
    search: str | None = Query(None, description="Search by name, code, or SKU"),
    category_id: int | None = Query(None, description="Filter by Category"),
    stock_status: str | None = Query(None, description="IN STOCK, LOW STOCK, OUT OF STOCK"),
    is_active: bool | None = Query(None, description="Filter active/inactive"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.view"))
):
    query = db.query(Product)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (Product.product_name.ilike(search_fmt)) |
            (Product.product_code.ilike(search_fmt)) |
            (Product.sku.ilike(search_fmt)) |
            (Product.barcode.ilike(search_fmt))
        )

    if category_id is not None:
        query = query.filter(Product.category_id == category_id)

    if is_active is not None:
        query = query.filter(Product.is_active == is_active)

    all_matching = query.order_by(Product.product_name.asc()).all()

    # Filter by stock_status if requested
    items = []
    for prod in all_matching:
        resp = build_product_response(prod, db)
        if stock_status:
            status_norm = stock_status.strip().upper().replace("_", " ")
            if resp.stock_status != status_norm:
                continue
        items.append(resp)

    total = len(items)
    paginated_items = items[skip : skip + limit]

    return ProductListResponse(total=total, items=paginated_items)

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.view"))
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return build_product_response(product, db)

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.product.create"))
):
    # Check category existence
    category = db.query(Category).filter(Category.id == payload.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category with ID {payload.category_id} does not exist"
        )

    # Unique code check
    if db.query(Product).filter(Product.product_code == payload.product_code).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with code '{payload.product_code}' already exists"
        )

    # Unique SKU check
    if db.query(Product).filter(Product.sku == payload.sku).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with SKU '{payload.sku}' already exists"
        )

    # Unique Barcode check if provided
    if payload.barcode and db.query(Product).filter(Product.barcode == payload.barcode).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with barcode '{payload.barcode}' already exists"
        )

    product = Product(
        product_code=payload.product_code,
        sku=payload.sku,
        barcode=payload.barcode,
        product_name=payload.product_name,
        description=payload.description,
        category_id=payload.category_id,
        unit=payload.unit,
        cost_price=payload.cost_price,
        selling_price=payload.selling_price,
        tax_percentage=payload.tax_percentage,
        reorder_level=payload.reorder_level,
        minimum_stock_level=payload.minimum_stock_level,
        maximum_stock_level=payload.maximum_stock_level,
        is_active=payload.is_active,
        created_by=current_user.id
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return build_product_response(product, db)

@router.put("/{product_id}", response_model=ProductResponse)
@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.product.update"))
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if payload.product_code and payload.product_code != product.product_code:
        conflict = db.query(Product).filter(
            Product.product_code == payload.product_code,
            Product.id != product_id
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with code '{payload.product_code}' already exists"
            )
        product.product_code = payload.product_code

    if payload.sku and payload.sku != product.sku:
        conflict = db.query(Product).filter(
            Product.sku == payload.sku,
            Product.id != product_id
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{payload.sku}' already exists"
            )
        product.sku = payload.sku

    if payload.barcode is not None and payload.barcode != product.barcode:
        if payload.barcode:
            conflict = db.query(Product).filter(
                Product.barcode == payload.barcode,
                Product.id != product_id
            ).first()
            if conflict:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Product with barcode '{payload.barcode}' already exists"
                )
        product.barcode = payload.barcode

    if payload.category_id is not None:
        category = db.query(Category).filter(Category.id == payload.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with ID {payload.category_id} does not exist"
            )
        product.category_id = payload.category_id

    if payload.product_name is not None:
        product.product_name = payload.product_name
    if payload.description is not None:
        product.description = payload.description
    if payload.unit is not None:
        product.unit = payload.unit
    if payload.cost_price is not None:
        product.cost_price = payload.cost_price
    if payload.selling_price is not None:
        product.selling_price = payload.selling_price
    if payload.tax_percentage is not None:
        product.tax_percentage = payload.tax_percentage
    if payload.reorder_level is not None:
        product.reorder_level = payload.reorder_level
    if payload.minimum_stock_level is not None:
        product.minimum_stock_level = payload.minimum_stock_level
    if payload.maximum_stock_level is not None:
        product.maximum_stock_level = payload.maximum_stock_level
    if payload.is_active is not None:
        product.is_active = payload.is_active

    db.commit()
    db.refresh(product)

    return build_product_response(product, db)

@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
def delete_product(
    product_id: int,
    force_deactivate: bool = Query(False, description="Deactivate product instead if transactions exist"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory.product.delete"))
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Safe deletion check: does the product have stock or transactions?
    has_stock = False
    if hasattr(product, 'inventory_items') and product.inventory_items:
        has_stock = any(item.quantity_on_hand > 0 for item in product.inventory_items)

    has_movements = hasattr(product, 'stock_movements') and len(product.stock_movements) > 0

    if has_stock or has_movements:
        if force_deactivate:
            product.is_active = False
            db.commit()
            return {
                "message": "Product is associated with existing inventory/transactions and has been safely deactivated.",
                "action": "deactivated",
                "id": product_id
            }
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product cannot be deleted because it is involved in inventory records or movements. Deactivate the product instead."
        )

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully", "action": "deleted", "id": product_id}
