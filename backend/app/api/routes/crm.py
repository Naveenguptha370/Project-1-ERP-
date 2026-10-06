from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.business import CRMActivity, Lead
from app.models.customer import Customer
from app.models.user import User
from app.schemas.crm import (
    CRMActivityResponse,
    CRMActivityCreate,
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate,
    LeadCreate,
    LeadResponse,
    LeadUpdate,
)

router = APIRouter(prefix="/crm", tags=["CRM"])


@router.get("/status")
def crm_status(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return {
        "module": "CRM",
        "status": "active",
        "customers": db.query(Customer).count(),
        "leads": db.query(Lead).count(),
    }


@router.get("/customers", response_model=list[CustomerResponse])
def list_customers(
    q: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Customer)
    if q:
        search = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Customer.name.ilike(search),
                Customer.company_name.ilike(search),
                Customer.email.ilike(search),
                Customer.phone.ilike(search),
            )
        )
    return query.order_by(Customer.id.desc()).offset(skip).limit(limit).all()


@router.post("/customers", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.email and db.query(Customer).filter(func.lower(Customer.email) == payload.email.lower()).first():
        raise HTTPException(status_code=409, detail="A customer with this email already exists")
    customer = Customer(**payload.model_dump())
    db.add(customer)
    db.flush()
    db.add(CRMActivity(customer_id=customer.id, user_id=user.id, action="Customer created"))
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.patch("/customers/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    values = payload.model_dump(exclude_unset=True)
    if values.get("email") and db.query(Customer).filter(
        func.lower(Customer.email) == values["email"].lower(),
        Customer.id != customer_id,
    ).first():
        raise HTTPException(status_code=409, detail="A customer with this email already exists")
    for field, value in values.items():
        setattr(customer, field, value)
    db.add(CRMActivity(customer_id=customer.id, user_id=user.id, action="Customer updated"))
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.query(CRMActivity).filter(CRMActivity.customer_id == customer.id).update(
        {CRMActivity.customer_id: None},
        synchronize_session=False,
    )
    db.query(Lead).filter(Lead.converted_customer_id == customer.id).update(
        {Lead.converted_customer_id: None},
        synchronize_session=False,
    )
    db.delete(customer)
    db.commit()


@router.get("/leads", response_model=list[LeadResponse])
def list_leads(
    status_filter: str | None = Query(default=None, alias="status"),
    q: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Lead)
    if status_filter:
        query = query.filter(Lead.status == status_filter)
    if q:
        search = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Lead.name.ilike(search),
                Lead.company_name.ilike(search),
                Lead.email.ilike(search),
                Lead.phone.ilike(search),
            )
        )
    return query.order_by(Lead.id.desc()).offset(skip).limit(limit).all()


@router.post("/leads", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    data = payload.model_dump()
    if data["assigned_to_id"] and not db.get(User, data["assigned_to_id"]):
        raise HTTPException(status_code=404, detail="Assigned user not found")
    lead = Lead(**data)
    db.add(lead)
    db.flush()
    db.add(CRMActivity(lead_id=lead.id, user_id=user.id, action="Lead created"))
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/leads/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.patch("/leads/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    payload: LeadUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead.converted_customer_id:
        raise HTTPException(status_code=409, detail="Converted leads cannot be edited")
    values = payload.model_dump(exclude_unset=True)
    if values.get("assigned_to_id") and not db.get(User, values["assigned_to_id"]):
        raise HTTPException(status_code=404, detail="Assigned user not found")
    for field, value in values.items():
        setattr(lead, field, value)
    db.add(CRMActivity(lead_id=lead.id, user_id=user.id, action="Lead updated"))
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/leads/{lead_id}/convert", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def convert_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead.converted_customer_id:
        raise HTTPException(status_code=409, detail="Lead has already been converted")
    if lead.status == "Lost":
        raise HTTPException(status_code=409, detail="Lost leads cannot be converted")
    if lead.email and db.query(Customer).filter(func.lower(Customer.email) == lead.email.lower()).first():
        raise HTTPException(status_code=409, detail="A customer with this lead's email already exists")

    customer = Customer(
        name=lead.name,
        company_name=lead.company_name,
        email=lead.email,
        phone=lead.phone,
    )
    db.add(customer)
    db.flush()
    lead.status = "Won"
    lead.converted_customer_id = customer.id
    db.add(CRMActivity(
        lead_id=lead.id,
        customer_id=customer.id,
        user_id=user.id,
        action="Lead converted to customer",
    ))
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/activities", response_model=list[CRMActivityResponse])
def list_activities(
    customer_id: int | None = Query(default=None, gt=0),
    lead_id: int | None = Query(default=None, gt=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if customer_id is None and lead_id is None:
        raise HTTPException(status_code=422, detail="Specify customer_id or lead_id")
    query = db.query(CRMActivity)
    if customer_id is not None:
        query = query.filter(CRMActivity.customer_id == customer_id)
    if lead_id is not None:
        query = query.filter(CRMActivity.lead_id == lead_id)
    return query.order_by(CRMActivity.created_at.desc()).limit(limit).all()


@router.post("/activities", response_model=CRMActivityResponse, status_code=status.HTTP_201_CREATED)
def create_activity(
    payload: CRMActivityCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if (payload.customer_id is None) == (payload.lead_id is None):
        raise HTTPException(status_code=422, detail="Specify exactly one customer_id or lead_id")
    if payload.customer_id is not None and not db.get(Customer, payload.customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")
    if payload.lead_id is not None and not db.get(Lead, payload.lead_id):
        raise HTTPException(status_code=404, detail="Lead not found")
    activity = CRMActivity(
        customer_id=payload.customer_id,
        lead_id=payload.lead_id,
        user_id=user.id,
        action=payload.action,
        details=payload.details,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity
