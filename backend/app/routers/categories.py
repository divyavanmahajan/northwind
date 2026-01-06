from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.auth.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.category import (
    CategoryCreate, CategoryUpdate, 
    CategoryResponse, CategoryListResponse
)
from app.schemas.common import PaginatedResponse, PaginationInfo, MessageResponse
from app.services.category_service import CategoryService
from math import ceil

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=PaginatedResponse[CategoryListResponse])
def list_categories(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    sort_by: str = Query("category_name", regex="^(category_id|category_name|created_at)$"),
    sort_order: str = Query("asc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all categories with pagination, search, and sorting.
    """
    service = CategoryService(db)
    categories, total = service.get_list(
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Add product counts
    result = []
    for cat in categories:
        cat_data = CategoryListResponse.model_validate(cat)
        cat_data.product_count = service.get_product_count(cat.category_id)
        result.append(cat_data)
    
    return PaginatedResponse(
        data=result,
        pagination=PaginationInfo(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=ceil(total / page_size) if total > 0 else 1,
            has_next=page * page_size < total,
            has_previous=page > 1
        )
    )

@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single category by ID."""
    service = CategoryService(db)
    category = service.get_by_id(category_id)
    
    if not category:
        from app.utils.exceptions import NotFoundError
        raise NotFoundError(f"Category with ID {category_id} not found")
    
    response = CategoryResponse.model_validate(category)
    response.product_count = service.get_product_count(category_id)
    return response

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """
    Create a new category.
    Requires: Admin or Manager role
    """
    service = CategoryService(db)
    category = service.create(data)
    response = CategoryResponse.model_validate(category)
    response.product_count = 0
    return response

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """
    Update an existing category.
    Requires: Admin or Manager role
    """
    service = CategoryService(db)
    category = service.update(category_id, data)
    response = CategoryResponse.model_validate(category)
    response.product_count = service.get_product_count(category_id)
    return response

@router.delete("/{category_id}", response_model=MessageResponse)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """
    Delete a category.
    Requires: Admin or Manager role
    Cannot delete categories with existing products.
    """
    service = CategoryService(db)
    service.delete(category_id)
    return MessageResponse(message=f"Category {category_id} deleted successfully")
