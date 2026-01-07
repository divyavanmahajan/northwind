from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User, UserRole
from app.auth.dependencies import get_current_user, get_current_active_user
from app.schemas.common import PaginatedResponse, PaginationInfo
from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerListResponse
)
from app.schemas.order import OrderListResponse
from app.services.customer_service import CustomerService
from app.utils.exceptions import NotFoundError

router = APIRouter(
    prefix="/customers",
    tags=["customers"]
)

@router.get("", response_model=PaginatedResponse[CustomerListResponse])
def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = None,
    country: Optional[str] = None,
    city: Optional[str] = None,
    sort_by: str = "company_name",
    sort_order: str = "asc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List customers.
    - Admin/Manager/Employee: See all customers
    - Customer: See only own customer profile
    """
    service = CustomerService(db, current_user)
    items, total = service.get_list(
        page=page,
        page_size=page_size,
        search=search,
        country=country,
        city=city,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Enrich with order count (placeholder for now)
    data = []
    for item in items:
        resp = CustomerListResponse.model_validate(item)
        resp.order_count = service.get_order_count(item.customer_id)
        data.append(resp)
    
    total_pages = (total + page_size - 1) // page_size
    pagination = PaginationInfo(
        page=page,
        page_size=page_size,
        total_items=total,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_previous=page > 1
    )
    
    return PaginatedResponse(
        data=data,
        pagination=pagination
    )

@router.get("/countries", response_model=List[str])
def get_countries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get distinct countries for filter dropdown."""
    service = CustomerService(db, current_user)
    return service.get_countries()

@router.get("/cities", response_model=List[str])
def get_cities(
    country: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get distinct cities for filter dropdown."""
    service = CustomerService(db, current_user)
    return service.get_cities(country)

@router.get("/me", response_model=CustomerResponse)
def get_my_customer_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's customer profile (for customer role)."""
    service = CustomerService(db, current_user)
    customer = service.get_for_current_user()
    if not customer:
        raise NotFoundError("No customer profile linked to your account")
    
    # Add statistics
    stats = service.get_statistics(customer.customer_id)
    response = CustomerResponse.model_validate(customer)
    response.statistics = stats
    return response

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get customer details."""
    service = CustomerService(db, current_user)
    customer = service.get_by_id(customer_id)
    if not customer:
        raise NotFoundError(f"Customer with ID {customer_id} not found")
    
    # Add statistics
    stats = service.get_statistics(customer_id)
    response = CustomerResponse.model_validate(customer)
    response.statistics = stats
    return response

@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create new customer (Admin/Manager only)."""
    from fastapi import HTTPException
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized to create customers")

    service = CustomerService(db, current_user)
    customer = service.create(data)
    
    stats = service.get_statistics(customer.customer_id)
    response = CustomerResponse.model_validate(customer)
    response.statistics = stats
    return response

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: str,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update customer (Admin/Manager only)."""
    from fastapi import HTTPException
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized to update customers")

    service = CustomerService(db, current_user)
    customer = service.update(customer_id, data)
    
    stats = service.get_statistics(customer.customer_id)
    response = CustomerResponse.model_validate(customer)
    response.statistics = stats
    return response

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete customer (Admin/Manager only)."""
    from fastapi import HTTPException
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized to delete customers")

    service = CustomerService(db, current_user)
    service.delete(customer_id)

@router.get("/{customer_id}/orders", response_model=PaginatedResponse[OrderListResponse])
def get_customer_orders(
    customer_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get customer's order history."""
    service = CustomerService(db, current_user)
    
    # Check access (Customer role can only see their own orders)
    if current_user.role == UserRole.CUSTOMER:
        customer = service.get_for_current_user()
        if not customer or customer.customer_id != customer_id:
            raise HTTPException(status_code=403, detail="Not authorized to view these orders")
            
    items, total = service.get_orders(
        customer_id=customer_id,
        page=page,
        page_size=page_size,
        status=status
    )
    
    total_pages = (total + page_size - 1) // page_size
    pagination = PaginationInfo(
        page=page,
        page_size=page_size,
        total_items=total,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_previous=page > 1
    )
    
    return PaginatedResponse(
        data=items,
        pagination=pagination
    )
