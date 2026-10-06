from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.database import get_db
from app.models.business import Expense
from app.models.user import User
from app.schemas.finance import ExpenseCreate, ExpenseResponse, ExpenseReview

router = APIRouter(prefix="/finance", tags=["Finance"])


@router.get("/status")
def finance_status(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return {
        "module": "Finance",
        "status": "active",
        "expenses": db.query(Expense).count(),
        "pending_approval": db.query(Expense).filter(Expense.status == "Submitted").count(),
    }


@router.get("/expenses", response_model=list[ExpenseResponse])
def list_expenses(
    status_filter: str | None = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Expense)
    if status_filter:
        query = query.filter(Expense.status == status_filter)
    return query.order_by(Expense.expense_date.desc(), Expense.id.desc()).offset(skip).limit(limit).all()


@router.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    expense = Expense(
        expense_number=f"EXP-{datetime.now(timezone.utc):%Y%m%d}-{uuid4().hex[:8].upper()}",
        created_by_id=user.id,
        expense_date=payload.expense_date or datetime.now(timezone.utc),
        **payload.model_dump(exclude={"expense_date"}),
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.patch(
    "/expenses/{expense_id}/review",
    response_model=ExpenseResponse,
    dependencies=[Depends(require_role(["ADMIN", "MANAGER"]))],
)
def review_expense(
    expense_id: int,
    payload: ExpenseReview,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    expense = db.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if expense.status != "Submitted":
        raise HTTPException(status_code=409, detail=f"Expense is already {expense.status.lower()}")
    if expense.created_by_id == user.id:
        raise HTTPException(status_code=403, detail="You cannot review your own expense")
    expense.status = payload.status
    expense.review_note = payload.review_note
    expense.reviewed_by_id = user.id
    expense.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(expense)
    return expense
