from fastapi import APIRouter

router = APIRouter(prefix="/hr", tags=["Member 2: HR Management (Pending)"])


@router.get("/status")
def hr_status():
    """Module status placeholder for Member 2."""
    return {
        "module": "HR Management",
        "assigned_to": "Member 2",
        "status": "In Development",
        "planned_entities": ["employees", "departments", "attendance", "leaves"],
    }
