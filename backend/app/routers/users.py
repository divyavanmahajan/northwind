from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from app.database import get_db
from app.auth.dependencies import require_roles
from app.models.user import User, UserRole
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, 
    UserListResponse, PasswordReset
)
from app.schemas.common import PaginatedResponse, PaginationInfo, MessageResponse
from app.services.user_service import UserService
from app.utils.exceptions import ValidationError, NotFoundError
from math import ceil

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=PaginatedResponse[UserListResponse])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """List all users with filtering. Admin only."""
    service = UserService(db)
    users, total = service.get_list(
        page=page, page_size=page_size,
        search=search, role=role, is_active=is_active,
        sort_by=sort_by, sort_order=sort_order
    )
    
    return PaginatedResponse(
        data=[UserListResponse.model_validate(u) for u in users],
        pagination=PaginationInfo(
            page=page, page_size=page_size,
            total_items=total,
            total_pages=ceil(total / page_size) if total > 0 else 1,
            has_next=page * page_size < total,
            has_previous=page > 1
        )
    )

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Get a single user by ID."""
    service = UserService(db)
    user = service.get_by_id(user_id)
    if not user:
        raise NotFoundError(f"User {user_id} not found")
    return UserResponse.model_validate(user)

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Create a new user. Admin only."""
    service = UserService(db)
    user = service.create(data, created_by=current_user.user_id)
    return UserResponse.model_validate(user)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Update user. Admin only."""
    service = UserService(db)
    user = service.update(user_id, data)
    return UserResponse.model_validate(user)

@router.patch("/{user_id}/activate", response_model=MessageResponse)
def activate_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Activate a user account."""
    service = UserService(db)
    service.set_active(user_id, True)
    return MessageResponse(message="User activated successfully")

@router.patch("/{user_id}/deactivate", response_model=MessageResponse)
def deactivate_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Deactivate a user account."""
    if str(current_user.user_id) == str(user_id):
        raise ValidationError("Cannot deactivate your own account")
    service = UserService(db)
    service.set_active(user_id, False)
    return MessageResponse(message="User deactivated successfully")

@router.patch("/{user_id}/reset-password", response_model=MessageResponse)
def reset_user_password(
    user_id: UUID,
    data: PasswordReset,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Reset user password. Admin only."""
    service = UserService(db)
    service.reset_password(user_id, data.new_password)
    return MessageResponse(message="Password reset successfully")

@router.delete("/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Delete a user. Admin only."""
    if str(current_user.user_id) == str(user_id):
        raise ValidationError("Cannot delete your own account")
    service = UserService(db)
    service.delete(user_id)
    return MessageResponse(message="User deleted successfully")
