from collections.abc import Callable

from app.core.security import decode_access_token
from app.database import get_db
from app.models.user import User
from app.models.revoked_token import RevokedToken
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception
    token_id = payload.get("jti")
    if not token_id or db.get(RevokedToken, token_id):
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
        
    if str(username).isdigit():
        user = db.query(User).filter(User.id == int(username)).first()
    else:
        user = db.query(User).filter((User.username == username) | (User.email == username)).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    return user

def require_permission(permission_code: str) -> Callable:
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_superuser:
            return current_user
        user_perms = current_user.permissions
        if "*" in user_perms or permission_code in user_perms:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: Requires '{permission_code}'"
        )
    return dependency

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
