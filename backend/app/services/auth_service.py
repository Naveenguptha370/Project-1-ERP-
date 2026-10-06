from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, Role
from app.schemas.auth import UserRegister
from app.core.security import verify_password, get_password_hash
from app.services.audit_service import log_audit_event


def get_user_by_username_or_email(db: Session, identifier: str) -> Optional[User]:
    """Find user by either username or email."""
    return db.query(User).filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()


def authenticate_user(
    db: Session,
    username_or_email: str,
    password: str,
    ip_address: Optional[str] = None
) -> User:
    """Authenticate credentials and write security audit logs."""
    user = get_user_by_username_or_email(db, username_or_email)
    
    if not user:
        log_audit_event(
            db=db,
            action="LOGIN_FAILED",
            details=f"User not found for identifier: {username_or_email}",
            ip_address=ip_address
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
        )
        
    if not verify_password(password, user.hashed_password):
        log_audit_event(
            db=db,
            action="LOGIN_FAILED",
            user_id=user.id,
            details=f"Invalid password attempt for username: {user.username}",
            ip_address=ip_address
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
        )
        
    if not user.is_active:
        log_audit_event(
            db=db,
            action="LOGIN_BLOCKED",
            user_id=user.id,
            details="Attempt to login to deactivated account",
            ip_address=ip_address
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact an administrator.",
        )

    log_audit_event(
        db=db,
        action="LOGIN",
        user_id=user.id,
        details=f"User {user.username} logged in successfully",
        ip_address=ip_address
    )
    return user


def register_user(
    db: Session,
    user_in: UserRegister,
    ip_address: Optional[str] = None
) -> User:
    """Register a new user with validation, hashing, and role assignment."""
    if user_in.confirm_password and user_in.password != user_in.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password and confirmation password do not match",
        )
        
    # Check duplicate username
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{user_in.username}' already exists",
        )
        
    # Check duplicate email
    if db.query(User).filter(User.email == user_in.email.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{user_in.email}' already exists",
        )

    # Resolve Role
    role = db.query(Role).filter(Role.name == "EMPLOYEE").first()
    if not role:
        role = Role(name="EMPLOYEE", description="Standard Employee")
        db.add(role)
        db.flush()

    # Create new User
    user = User(
        full_name=user_in.full_name,
        username=user_in.username,
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        is_active=True,
        is_superuser=False,
    )
    user.roles.append(role)
    
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit_event(
        db=db,
        action="USER_REGISTERED",
        user_id=user.id,
        details=f"New user {user.username} registered",
        ip_address=ip_address
    )
    return user
