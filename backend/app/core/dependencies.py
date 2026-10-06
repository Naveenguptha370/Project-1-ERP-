from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.revoked_token import RevokedToken

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Validate Bearer JWT token and return active User instance."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_id = payload.get("jti")
    if not token_id or db.get(RevokedToken, token_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user_id_str.isdigit():
        user = db.query(User).filter(User.id == int(user_id_str)).first()
    else:
        user = db.query(User).filter(
            (User.username == user_id_str) | (User.email == user_id_str)
        ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User associated with token not found",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    
    return user


def require_role(allowed_roles: List[str]):
    """Enforce role-based access control (RBAC)."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_roles = [r.name for r in current_user.roles]
        # Superuser / ADMIN always has full access
        if current_user.is_superuser or "ADMIN" in user_roles:
            return current_user
        
        has_permission = any(role in allowed_roles for role in user_roles)
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {allowed_roles}",
            )
        return current_user
    return role_checker


def require_permission(permission_code: str):
    """Enforce granular permission-based access control."""
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_superuser:
            return current_user
            
        user_permissions = []
        for role in current_user.roles:
            for perm in role.permissions:
                user_permissions.append(perm.code)
                
        if permission_code not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission_code} required",
            )
        return current_user
    return permission_checker


require_manager_or_admin = require_role(["MANAGER"])
