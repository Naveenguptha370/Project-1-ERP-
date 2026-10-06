from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.auth import Token, UserLogin, UserRegister, UserOut
from app.services.auth_service import authenticate_user, register_user
from app.services.audit_service import log_audit_event
from app.core.security import create_access_token, decode_access_token
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.revoked_token import RevokedToken

router = APIRouter(prefix="/auth", tags=["Authentication & Security"])


@router.get("/status")
def auth_status():
    """Authentication service status."""
    return {"module": "Authentication", "status": "active", "online": True}


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, request: Request, db: Session = Depends(get_db)):
    """Register a new user account with hashed password and role assignment."""
    client_ip = request.client.host if request.client else None
    user = register_user(db=db, user_in=user_in, ip_address=client_ip)
    return user


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Authenticate credentials and return JWT bearer token."""
    client_ip = request.client.host if request.client else None
    user = authenticate_user(
        db=db,
        username_or_email=login_data.username_or_email,
        password=login_data.password,
        ip_address=client_ip,
    )
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user session."""
    return current_user


@router.post("/logout")
def logout(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Revoke the current bearer token and record the logout event."""
    client_ip = request.client.host if request.client else None
    authorization = request.headers.get("Authorization", "")
    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_access_token(token)
    if not payload or not payload.get("jti") or not payload.get("exp"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    db.add(
        RevokedToken(
            jti=payload["jti"],
            user_id=current_user.id,
            expires_at=datetime.fromtimestamp(payload["exp"], timezone.utc),
        )
    )
    log_audit_event(
        db=db,
        action="LOGOUT",
        user_id=current_user.id,
        details=f"User {current_user.username} logged out",
        ip_address=client_ip,
    )
    return {"message": "Successfully logged out"}


@router.get("/protected")
def test_protected(current_user: User = Depends(get_current_user)):
    """Security test endpoint for any authenticated user."""
    return {
        "message": f"Hello {current_user.full_name}, you have valid JWT access!",
        "user_id": current_user.id,
        "roles": [r.name for r in current_user.roles],
    }


@router.get("/admin-only")
def test_admin_only(current_user: User = Depends(require_role(["ADMIN"]))):
    """Security test endpoint restricted strictly to ADMIN role."""
    return {
        "message": f"Welcome Admin {current_user.full_name}! Full administrative access granted.",
        "admin": True,
        "role": "ADMIN",
    }
