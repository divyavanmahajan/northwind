from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from math import ceil
from app.database import get_db
from app.auth.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.order import OrderStatus
from app.schemas.order import (
    OrderCreate, OrderUpdate, OrderResponse, OrderListResponse
)
from app.schemas.common import PaginatedResponse, PaginationInfo
from app.services.order_service import OrderService
from app.utils.exceptions import NotFoundError

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("", response_model=PaginatedResponse[OrderListResponse])
def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: Optional[OrderStatus] = Query(None),
    customer_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = OrderService(db, current_user)
    orders, total = service.get_list(
        page=page, 
        page_size=page_size, 
        status=status,
        customer_id=customer_id
    )
    
    return PaginatedResponse(
        data=[OrderListResponse.model_validate(o) for o in orders],
        pagination=PaginationInfo(
            page=page, page_size=page_size,
            total_items=total,
            total_pages=ceil(total / page_size) if total > 0 else 1,
            has_next=page * page_size < total,
            has_previous=page > 1
        )
    )

@router.get("/filters/statuses", response_model=List[str])
def get_statuses(current_user: User = Depends(get_current_user)):
    return [s.value for s in OrderStatus]

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = OrderService(db, current_user)
    order = service.get_by_id(order_id)
    if not order:
        raise NotFoundError(f"Order {order_id} not found")
    
    return OrderResponse.model_validate(order)

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = OrderService(db, current_user)
    order = service.create(data)
    return OrderResponse.model_validate(order)

@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    data: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = OrderService(db, current_user)
    order = service.update(order_id, data)
    return OrderResponse.model_validate(order)

@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status: OrderStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = OrderService(db, current_user)
    order = service.update_status(order_id, status)
    return OrderResponse.model_validate(order)

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    service = OrderService(db, current_user)
    service.delete(order_id)
