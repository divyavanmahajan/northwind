from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.auth.jwt import decode_token, TokenData
from app.models.user import User, UserRole
from app.services.user_service import UserService

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency that extracts and validates the JWT token,
    then returns the current user.
    """
    token = credentials.credentials
    token_data = decode_token(token)
    
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user_service = UserService(db)
    user = user_service.get_by_id(token_data.user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Alias for get_current_user that emphasizes active status."""
    return current_user

def require_roles(allowed_roles: List[UserRole]):
    """
    Dependency factory that checks if user has required role.
    
    Usage:
        @router.get("/admin-only")
        def admin_route(user: User = Depends(require_roles([UserRole.ADMIN]))):
            ...
    """
    async def role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' not authorized for this resource"
            )
        return current_user
    
    return role_checker

# Convenience dependencies for common role combinations
require_admin = require_roles([UserRole.ADMIN])
require_manager_or_admin = require_roles([UserRole.ADMIN, UserRole.MANAGER])
require_employee_or_above = require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE])

class OptionalHTTPBearer(HTTPBearer):
    async def __call__(self, request: Request):
        try:
            return await super().__call__(request)
        except HTTPException:
            return None

optional_security = OptionalHTTPBearer(auto_error=False)

async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Returns current user if authenticated, None otherwise.
    Useful for routes that have different behavior for authenticated users.
    """
    if credentials is None:
        return None
    
    token_data = decode_token(credentials.credentials)
    if token_data is None:
        return None
    
    user_service = UserService(db)
    return user_service.get_by_id(token_data.user_id)
