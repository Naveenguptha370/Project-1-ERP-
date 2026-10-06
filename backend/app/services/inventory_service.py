from decimal import Decimal

from app.models.category import Category
from app.models.inventory import WarehouseStock
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.warehouse import Warehouse
from fastapi import HTTPException, status
from sqlalchemy.orm import Session


class InventoryService:
    @staticmethod
    def get_or_create_stock(
        db: Session, 
        product_id: int, 
        warehouse_id: int, 
        for_update: bool = False
    ) -> WarehouseStock:
        query = db.query(WarehouseStock).filter(
            WarehouseStock.product_id == product_id,
            WarehouseStock.warehouse_id == warehouse_id
        )
        if for_update and db.bind and db.bind.dialect.name != "sqlite":
            query = query.with_for_update()
            
        stock = query.first()
        if not stock:
            # Look up product's default reorder level
            product = db.query(Product).filter(Product.id == product_id).first()
            reorder = product.reorder_level if product else 10

            stock = WarehouseStock(
                product_id=product_id,
                warehouse_id=warehouse_id,
                quantity_on_hand=0,
                reserved_quantity=0,
                available_quantity=0,
                reorder_level=reorder
            )
            db.add(stock)
            db.flush()
        return stock

    @staticmethod
    def stock_in(
        db: Session,
        product_id: int,
        warehouse_id: int,
        quantity: int,
        reference_type: str = "MANUAL",
        reference_number: str | None = None,
        notes: str | None = None,
        user_id: int | None = None
    ) -> tuple[WarehouseStock, StockMovement]:
        if quantity <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be greater than zero")

        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product with ID {product_id} not found")

        warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
        if not warehouse:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Warehouse with ID {warehouse_id} not found")

        stock = InventoryService.get_or_create_stock(db, product_id, warehouse_id, for_update=True)
        qty_before = stock.quantity_on_hand
        qty_after = qty_before + quantity

        stock.quantity_on_hand = qty_after
        stock.sync_available()

        movement = StockMovement(
            product_id=product_id,
            warehouse_id=warehouse_id,
            movement_type="STOCK_IN",
            quantity=quantity,
            quantity_before=qty_before,
            quantity_after=qty_after,
            reference_type=reference_type,
            reference_id=reference_number,
            notes=notes,
            created_by=user_id
        )
        db.add(movement)
        db.commit()
        db.refresh(stock)
        db.refresh(movement)
        return stock, movement

    @staticmethod
    def stock_out(
        db: Session,
        product_id: int,
        warehouse_id: int,
        quantity: int,
        reference_type: str = "MANUAL",
        reference_number: str | None = None,
        notes: str | None = None,
        user_id: int | None = None
    ) -> tuple[WarehouseStock, StockMovement]:
        if quantity <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be greater than zero")

        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product with ID {product_id} not found")

        warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
        if not warehouse:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Warehouse with ID {warehouse_id} not found")

        stock = InventoryService.get_or_create_stock(db, product_id, warehouse_id, for_update=True)

        if stock.available_quantity < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock. Only {stock.available_quantity} units are available."
            )

        qty_before = stock.quantity_on_hand
        qty_after = qty_before - quantity

        stock.quantity_on_hand = qty_after
        stock.sync_available()

        movement = StockMovement(
            product_id=product_id,
            warehouse_id=warehouse_id,
            movement_type="STOCK_OUT",
            quantity=quantity,
            quantity_before=qty_before,
            quantity_after=qty_after,
            reference_type=reference_type,
            reference_id=reference_number,
            notes=notes,
            created_by=user_id
        )
        db.add(movement)
        db.commit()
        db.refresh(stock)
        db.refresh(movement)
        return stock, movement

    @staticmethod
    def stock_adjust(
        db: Session,
        product_id: int,
        warehouse_id: int,
        adjustment_type: str,
        quantity: int,
        reason: str,
        notes: str | None = None,
        user_id: int | None = None
    ) -> tuple[WarehouseStock, StockMovement]:
        if quantity <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Adjustment quantity must be greater than zero")

        stock = InventoryService.get_or_create_stock(db, product_id, warehouse_id, for_update=True)
        qty_before = stock.quantity_on_hand

        adj_type_upper = adjustment_type.strip().upper()
        if adj_type_upper == "INCREASE":
            qty_after = qty_before + quantity
            movement_type = "ADJUSTMENT_IN"
        elif adj_type_upper == "DECREASE":
            if stock.available_quantity < quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for decrease. Current available stock is {stock.available_quantity} units."
                )
            qty_after = qty_before - quantity
            movement_type = "ADJUSTMENT_OUT"
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Adjustment type must be INCREASE or DECREASE")

        stock.quantity_on_hand = qty_after
        stock.sync_available()

        audit_notes = f"Reason: {reason}"
        if notes:
            audit_notes += f" | {notes}"

        movement = StockMovement(
            product_id=product_id,
            warehouse_id=warehouse_id,
            movement_type=movement_type,
            quantity=quantity,
            quantity_before=qty_before,
            quantity_after=qty_after,
            reference_type="ADJUSTMENT",
            reference_id=reason,
            notes=audit_notes,
            created_by=user_id
        )
        db.add(movement)
        db.commit()
        db.refresh(stock)
        db.refresh(movement)
        return stock, movement

    @staticmethod
    def transfer_stock(
        db: Session,
        product_id: int,
        source_warehouse_id: int,
        destination_warehouse_id: int,
        quantity: int,
        reference_number: str | None = None,
        notes: str | None = None,
        user_id: int | None = None
    ) -> tuple[WarehouseStock, WarehouseStock, StockMovement, StockMovement]:
        if source_warehouse_id == destination_warehouse_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Source and destination warehouses cannot be identical."
            )
        if quantity <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transfer quantity must be greater than zero")

        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product with ID {product_id} not found")

        source_wh = db.query(Warehouse).filter(Warehouse.id == source_warehouse_id).first()
        if not source_wh:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Source warehouse {source_warehouse_id} not found")

        dest_wh = db.query(Warehouse).filter(Warehouse.id == destination_warehouse_id).first()
        if not dest_wh:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Destination warehouse {destination_warehouse_id} not found")

        try:
            # Lock source stock
            source_stock = InventoryService.get_or_create_stock(db, product_id, source_warehouse_id, for_update=True)
            if source_stock.available_quantity < quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock in source warehouse '{source_wh.warehouse_name}'. Available: {source_stock.available_quantity}, Required: {quantity}"
                )

            # Lock destination stock
            dest_stock = InventoryService.get_or_create_stock(db, product_id, destination_warehouse_id, for_update=True)

            src_before = source_stock.quantity_on_hand
            src_after = src_before - quantity
            source_stock.quantity_on_hand = src_after
            source_stock.sync_available()

            dest_before = dest_stock.quantity_on_hand
            dest_after = dest_before + quantity
            dest_stock.quantity_on_hand = dest_after
            dest_stock.sync_available()

            transfer_ref = reference_number or f"TRF-{product_id}-{source_warehouse_id}-{destination_warehouse_id}"

            # Movement Out from Source
            mv_out = StockMovement(
                product_id=product_id,
                warehouse_id=source_warehouse_id,
                movement_type="TRANSFER_OUT",
                quantity=quantity,
                quantity_before=src_before,
                quantity_after=src_after,
                source_warehouse_id=source_warehouse_id,
                destination_warehouse_id=destination_warehouse_id,
                reference_type="TRANSFER",
                reference_id=transfer_ref,
                notes=notes,
                created_by=user_id
            )
            db.add(mv_out)

            # Movement In to Destination
            mv_in = StockMovement(
                product_id=product_id,
                warehouse_id=destination_warehouse_id,
                movement_type="TRANSFER_IN",
                quantity=quantity,
                quantity_before=dest_before,
                quantity_after=dest_after,
                source_warehouse_id=source_warehouse_id,
                destination_warehouse_id=destination_warehouse_id,
                reference_type="TRANSFER",
                reference_id=transfer_ref,
                notes=notes,
                created_by=user_id
            )
            db.add(mv_in)

            db.commit()
            db.refresh(source_stock)
            db.refresh(dest_stock)
            db.refresh(mv_out)
            db.refresh(mv_in)
            return source_stock, dest_stock, mv_out, mv_in
        except Exception:
            db.rollback()
            raise

    # -------------------------------------------------------------------------
    # INTEGRATION HOOK: Sales Management Subsystem
    # -------------------------------------------------------------------------
    @staticmethod
    def deduct_stock(
        db: Session,
        product_id: int,
        warehouse_id: int,
        quantity: int,
        reference_id: str,
        notes: str | None = "Sales Order Confirmation",
        user_id: int | None = None
    ) -> StockMovement:
        """
        Reusable integration service for Sales Management Subsystem.
        Deducts stock atomically upon confirmed sales invoice/order.
        """
        _stock, movement = InventoryService.stock_out(
            db=db,
            product_id=product_id,
            warehouse_id=warehouse_id,
            quantity=quantity,
            reference_type="SALE",
            reference_number=reference_id,
            notes=notes,
            user_id=user_id
        )
        # Update movement_type to SALE
        movement.movement_type = "SALE"
        db.commit()
        return movement

    # -------------------------------------------------------------------------
    # INTEGRATION HOOK: Procurement & Purchases Subsystem
    # -------------------------------------------------------------------------
    @staticmethod
    def add_stock(
        db: Session,
        product_id: int,
        warehouse_id: int,
        quantity: int,
        reference_id: str,
        notes: str | None = "Purchase Order Receipt",
        user_id: int | None = None
    ) -> StockMovement:
        """
        Reusable integration service for Procurement & Purchases Subsystem.
        Increases stock atomically upon receipt of purchase shipment.
        """
        _stock, movement = InventoryService.stock_in(
            db=db,
            product_id=product_id,
            warehouse_id=warehouse_id,
            quantity=quantity,
            reference_type="PURCHASE",
            reference_number=reference_id,
            notes=notes,
            user_id=user_id
        )
        movement.movement_type = "PURCHASE"
        db.commit()
        return movement

    # -------------------------------------------------------------------------
    # INTEGRATION HOOK: Dashboard & Analytics Subsystem
    # -------------------------------------------------------------------------
    @staticmethod
    def get_inventory_summary(db: Session) -> dict:
        """
        Provides comprehensive inventory metrics, valuation, and analytics.
        Valuation = SUM(current_stock * cost_price)
        """
        total_products = db.query(Product).count()
        total_categories = db.query(Category).count()
        total_warehouses = db.query(Warehouse).count()

        # All inventory items
        stocks = (
            db.query(WarehouseStock, Product)
            .join(Product, WarehouseStock.product_id == Product.id)
            .all()
        )

        total_units = sum(s.WarehouseStock.quantity_on_hand for s in stocks)
        
        # Valuation: SUM(quantity_on_hand * cost_price)
        valuation = Decimal("0.00")
        for s in stocks:
            valuation += Decimal(str(s.WarehouseStock.quantity_on_hand)) * Decimal(str(s.Product.cost_price))

        low_stock_count = sum(1 for s in stocks if 0 < s.WarehouseStock.available_quantity <= s.WarehouseStock.reorder_level)
        out_of_stock_count = sum(1 for s in stocks if s.WarehouseStock.available_quantity <= 0)

        # Products with 0 total stock count
        all_prods = db.query(Product).all()
        for p in all_prods:
            if p.total_stock <= 0 and p.id not in [s.WarehouseStock.product_id for s in stocks]:
                out_of_stock_count += 1

        # Categories breakdown
        categories = db.query(Category).all()
        cat_breakdown = []
        for cat in categories:
            prod_count = db.query(Product).filter(Product.category_id == cat.id).count()
            cat_breakdown.append({
                "category_id": cat.id,
                "category_name": cat.category_name,
                "product_count": prod_count
            })

        # Warehouses breakdown
        warehouses = db.query(Warehouse).all()
        wh_breakdown = []
        for wh in warehouses:
            wh_stocks = db.query(WarehouseStock).filter(WarehouseStock.warehouse_id == wh.id).all()
            wh_units = sum(ws.quantity_on_hand for ws in wh_stocks)
            wh_breakdown.append({
                "warehouse_id": wh.id,
                "warehouse_name": wh.warehouse_name,
                "warehouse_code": wh.warehouse_code,
                "total_units": wh_units
            })

        return {
            "total_products": total_products,
            "total_categories": total_categories,
            "total_warehouses": total_warehouses,
            "total_units_in_stock": total_units,
            "low_stock_products_count": low_stock_count,
            "out_of_stock_products_count": out_of_stock_count,
            "inventory_valuation": valuation,
            "categories_breakdown": cat_breakdown,
            "warehouses_breakdown": wh_breakdown
        }
