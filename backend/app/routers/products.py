from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from decimal import Decimal

from app.database import get_db
from app.schemas.product import (
    ProductCreate, 
    ProductUpdate, 
    ProductResponse, 
    ProductListResponse
)
from app.schemas.common import PaginatedResponse, ErrorResponse
from app.services.product_service import ProductService
from app.auth.dependencies import get_current_user, require_manager_or_admin
from app.models.user import User, UserRole

router = APIRouter(prefix="/products", tags=["products"])

@router.get("", response_model=PaginatedResponse[ProductListResponse])
def get_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    stock_status: Optional[str] = None,
    price_min: Optional[Decimal] = None,
    price_max: Optional[Decimal] = None,
    discontinued: Optional[bool] = None,
    sort_by: str = "product_name",
    sort_order: str = "asc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db)
    products, total = service.get_list(
        page=page,
        page_size=page_size,
        search=search,
        category_id=category_id,
        supplier_id=supplier_id,
        stock_status=stock_status,
        price_min=price_min,
        price_max=price_max,
        discontinued=discontinued,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Map to List Response
    list_data = []
    for p in products:
        list_data.append(ProductListResponse(
            product_id=p.product_id,
            product_name=p.product_name,
            category_name=p.category.category_name if p.category else None,
            supplier_name=p.supplier.company_name if p.supplier else None,
            unit_price=p.unit_price,
            units_in_stock=p.units_in_stock,
            stock_status=p.stock_status,
            discontinued=p.discontinued
        ))
    
    total_pages = (total + page_size - 1) // page_size
    
    return {
        "data": list_data,
        "pagination": {
            "total_items": total,
            "total_pages": total_pages,
            "page": page,
            "page_size": page_size,
            "has_next": page < total_pages,
            "has_previous": page > 1
        }
    }

@router.get("/filters/price-range")
def get_price_range(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db)
    min_price, max_price = service.get_price_range()
    return {"min": min_price, "max": max_price}

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db)
    return service.get_by_id(product_id)

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    service = ProductService(db)
    return service.create(data)

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    service = ProductService(db)
    return service.update(product_id, data)

@router.patch("/{product_id}/discontinue", response_model=ProductResponse)
def discontinue_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    service = ProductService(db)
    return service.discontinue(product_id)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    service = ProductService(db)
    service.delete(product_id)
    return None
