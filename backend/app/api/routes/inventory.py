from fastapi import APIRouter

router = APIRouter(prefix="/inventory", tags=["Member 4: Inventory (Pending)"])


@router.get("/status")
def inventory_status():
    """Module status placeholder for Member 4."""
    return {
        "module": "Inventory Management",
        "assigned_to": "Member 4",
        "status": "In Development",
        "planned_entities": ["products", "categories", "warehouses", "inventory", "stock_movements"],
    }
