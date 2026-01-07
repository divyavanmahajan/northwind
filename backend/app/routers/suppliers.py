from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.auth.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.supplier import (
    SupplierCreate, SupplierUpdate,
    SupplierResponse, SupplierListResponse
)
from app.schemas.common import PaginatedResponse, PaginationInfo, MessageResponse
from app.services.supplier_service import SupplierService
from math import ceil

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("", response_model=PaginatedResponse[SupplierListResponse])
def list_suppliers(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    country: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    sort_by: str = Query("company_name"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List suppliers with pagination, search, and filtering."""
    service = SupplierService(db)
    suppliers, total = service.get_list(
        page=page, page_size=page_size,
        search=search, country=country, city=city,
        sort_by=sort_by, sort_order=sort_order
    )
    
    result = []
    for sup in suppliers:
        sup_data = SupplierListResponse.model_validate(sup)
        sup_data.product_count = service.get_product_count(sup.supplier_id)
        result.append(sup_data)
    
    return PaginatedResponse(
        data=result,
        pagination=PaginationInfo(
            page=page, page_size=page_size,
            total_items=total,
            total_pages=ceil(total / page_size) if total > 0 else 1,
            has_next=page * page_size < total,
            has_previous=page > 1
        )
    )

@router.get("/filters/countries", response_model=List[str])
def get_countries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of distinct countries for filtering."""
    service = SupplierService(db)
    return service.get_countries()

@router.get("/filters/cities", response_model=List[str])
def get_cities(
    country: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of distinct cities for filtering."""
    service = SupplierService(db)
    return service.get_cities(country)

@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single supplier by ID."""
    service = SupplierService(db)
    supplier = service.get_by_id(supplier_id)
    if not supplier:
        from app.utils.exceptions import NotFoundError
        raise NotFoundError(f"Supplier with ID {supplier_id} not found")
    
    response = SupplierResponse.model_validate(supplier)
    response.product_count = service.get_product_count(supplier_id)
    return response

@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Create a new supplier. Requires Admin or Manager role."""
    service = SupplierService(db)
    supplier = service.create(data)
    response = SupplierResponse.model_validate(supplier)
    response.product_count = 0
    return response

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Update supplier. Requires Admin or Manager role."""
    service = SupplierService(db)
    supplier = service.update(supplier_id, data)
    response = SupplierResponse.model_validate(supplier)
    response.product_count = service.get_product_count(supplier_id)
    return response

@router.delete("/{supplier_id}", response_model=MessageResponse)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Soft delete supplier. Requires Admin or Manager role."""
    service = SupplierService(db)
    service.delete(supplier_id)
    return MessageResponse(message=f"Supplier {supplier_id} deleted successfully")
