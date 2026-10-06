from app.dependencies import get_current_user
from app.models.user import User
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/hr", tags=["Human Resources Management"])

@router.get("/summary")
def get_hr_summary(current_user: User = Depends(get_current_user)):
    return {
        "module": "HR Management",
        "subsystem": "Human Resources Management",
        "employees_count": 48,
        "departments_count": 6,
        "active_on_leave": 3,
        "status": "Operational"
    }
