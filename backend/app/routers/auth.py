from app.core.security import create_access_token, decode_access_token, get_password_hash, verify_password
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import Permission, Role, User
from app.models.revoked_token import RevokedToken
from app.schemas.user import LoginRequest, Token, UserCreate, UserResponse
from app.services.audit_service import AuditService
from app.core.config import settings
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["Authentication & Security"])

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

def ensure_default_roles_and_permissions(db: Session):
    permissions_data = [
        ("AUTH_LOGIN", "User Login Permission", "AUTH"),
        ("AUTH_REGISTER", "User Registration Permission", "AUTH"),
        ("USER_CREATE", "Create System User", "USERS"),
        ("USER_READ", "Read System Users", "USERS"),
        ("USER_UPDATE", "Update System User", "USERS"),
        ("USER_DELETE", "Delete System User", "USERS"),
        ("ROLE_CREATE", "Create System Role", "ROLES"),
        ("ROLE_READ", "Read System Roles", "ROLES"),
        ("ROLE_UPDATE", "Update System Role", "ROLES"),
        ("ROLE_DELETE", "Delete System Role", "ROLES"),
        ("inventory.view", "View Inventory", "Inventory"),
        ("inventory.product.create", "Create Product", "Inventory"),
        ("inventory.product.update", "Update Product", "Inventory"),
        ("inventory.product.delete", "Delete Product", "Inventory"),
        ("inventory.category.create", "Create Category", "Inventory"),
        ("inventory.category.update", "Update Category", "Inventory"),
        ("inventory.category.delete", "Delete Category", "Inventory"),
        ("inventory.warehouse.create", "Create Warehouse", "Inventory"),
        ("inventory.warehouse.update", "Update Warehouse", "Inventory"),
        ("inventory.warehouse.delete", "Delete Warehouse", "Inventory"),
        ("inventory.stock.in", "Stock In", "Inventory"),
        ("inventory.stock.out", "Stock Out", "Inventory"),
        ("inventory.stock.adjust", "Stock Adjustment", "Inventory"),
        ("inventory.stock.transfer", "Stock Transfer", "Inventory"),
    ]
    
    perm_map = {}
    for code, name, module in permissions_data:
        p = db.query(Permission).filter(Permission.code == code).first()
        if not p:
            p = Permission(name=name, code=code, module=module, description=name)
            db.add(p)
            db.flush()
        perm_map[code] = p

    role_permissions = {
        "ADMIN": set(perm_map),
        "MANAGER": {
            code for code in perm_map
            if code.startswith("inventory.") or code in ("AUTH_LOGIN", "USER_READ", "ROLE_READ")
        },
        "EMPLOYEE": {"AUTH_LOGIN", "inventory.view"},
    }
    role_descriptions = {
        "ADMIN": "Unrestricted enterprise administration",
        "MANAGER": "Operational Manager with full Inventory authority",
        "EMPLOYEE": "Standard Enterprise Employee",
    }
    roles = {}
    for role_name, permission_codes in role_permissions.items():
        role = db.query(Role).filter(Role.name == role_name).first()
        if role is None:
            role = Role(name=role_name, description=role_descriptions[role_name])
            db.add(role)
            db.flush()

        assigned_codes = {permission.code for permission in role.permissions}
        role.permissions.extend(
            perm_map[code]
            for code in permission_codes - assigned_codes
        )
        roles[role_name] = role

    return roles


def seed_default_roles_and_admin(db: Session):
    roles = ensure_default_roles_and_permissions(db)
    admin_role = roles["ADMIN"]

    # Provision an administrator only when explicit credentials are configured.
    if settings.ADMIN_PASSWORD:
        if len(settings.ADMIN_PASSWORD) < 12:
            raise ValueError("ADMIN_PASSWORD must contain at least 12 characters")
        if not settings.ADMIN_EMAIL:
            raise ValueError("ADMIN_EMAIL is required when ADMIN_PASSWORD is configured")
        admin_user = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
    else:
        admin_user = None
    if settings.ADMIN_PASSWORD:
        email_owner = db.query(User).filter(
            User.email == settings.ADMIN_EMAIL,
            User.username != settings.ADMIN_USERNAME,
        ).first()
        if email_owner:
            raise ValueError("ADMIN_EMAIL is already assigned to a different user")
        if not admin_user:
            admin_user = User(username=settings.ADMIN_USERNAME)
            db.add(admin_user)
        admin_user.email = settings.ADMIN_EMAIL
        admin_user.full_name = settings.ADMIN_FULL_NAME
        admin_user.hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
        admin_user.is_active = True
        admin_user.is_superuser = True
        admin_user.roles = [admin_role]

    db.commit()

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ip = get_client_ip(request)
    user = db.query(User).filter(
        (User.username == payload.username_or_email) | (User.email == payload.username_or_email)
    ).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        AuditService.log(
            db=db,
            action="FAILED_LOGIN",
            description=f"Failed login attempt for '{payload.username_or_email}'",
            ip_address=ip
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password"
        )
    if not user.is_active:
        AuditService.log(
            db=db,
            action="FAILED_LOGIN",
            description=f"Attempted login on inactive account '{user.username}'",
            user_id=user.id,
            ip_address=ip
        )
        raise HTTPException(status_code=400, detail="Account is disabled")

    # Record successful login
    AuditService.log(
        db=db,
        action="LOGIN",
        description=f"User '{user.username}' logged in successfully.",
        user_id=user.id,
        ip_address=ip
    )

    access_token = create_access_token(data={"sub": user.username})
    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        created_at=user.created_at,
        roles=[r for r in user.roles],
        permissions=list(user.permissions)
    )
    return Token(access_token=access_token, token_type="bearer", user=user_resp)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, request: Request, db: Session = Depends(get_db)):
    ip = get_client_ip(request)
    existing_email = db.query(User).filter(User.email == payload.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists"
        )

    existing_user = db.query(User).filter(User.username == payload.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this username already exists"
        )

    new_user = User(
        email=payload.email,
        username=payload.username,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        is_active=True,
        is_superuser=False
    )

    emp_role = db.query(Role).filter(Role.name == "EMPLOYEE").first()
    if not emp_role:
        emp_role = Role(name="EMPLOYEE", description="Standard Employee")
        db.add(emp_role)
        db.flush()
    new_user.roles = [emp_role]

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    AuditService.log(
        db=db,
        action="REGISTER",
        description=f"New user registered: '{new_user.username}' ({new_user.email})",
        user_id=new_user.id,
        ip_address=ip
    )

    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        username=new_user.username,
        full_name=new_user.full_name,
        is_active=new_user.is_active,
        is_superuser=new_user.is_superuser,
        created_at=new_user.created_at,
        roles=[r for r in new_user.roles],
        permissions=list(new_user.permissions)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_superuser=current_user.is_superuser,
        created_at=current_user.created_at,
        roles=[r for r in current_user.roles],
        permissions=list(current_user.permissions)
    )

@router.post("/logout")
def logout(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ip = get_client_ip(request)
    authorization = request.headers.get("Authorization", "")
    payload = decode_access_token(authorization.removeprefix("Bearer ").strip())
    if not payload or not payload.get("jti") or not payload.get("exp"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    db.add(
        RevokedToken(
            jti=payload["jti"],
            user_id=current_user.id,
            expires_at=datetime.fromtimestamp(payload["exp"], timezone.utc),
        )
    )
    db.commit()
    AuditService.log(
        db=db,
        action="LOGOUT",
        description=f"User '{current_user.username}' logged out.",
        user_id=current_user.id,
        ip_address=ip
    )
    return {"message": "Logged out successfully"}

@router.get("/protected")
def protected_test_route(current_user: User = Depends(get_current_user)):
    return {
        "message": "Access granted to protected endpoint",
        "username": current_user.username,
        "is_authenticated": True
    }

@router.get("/admin-only")
def admin_only_test_route(current_user: User = Depends(get_current_user)):
    if not current_user.is_superuser and not any(r.name == "ADMIN" for r in current_user.roles):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required")
    return {
        "message": "Access granted to admin-only endpoint",
        "username": current_user.username,
        "role": "ADMIN"
    }
