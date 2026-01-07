from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date
from decimal import Decimal
from app.models.order import OrderStatus
from app.schemas.customer import CustomerInfo
from app.schemas.employee import EmployeeInfo
from app.schemas.shipper import ShipperInfo

class OrderDetailCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: Optional[Decimal] = None  # If not provided, use product price
    discount: Decimal = Field(default=Decimal(0), ge=0, le=1)

class OrderCreate(BaseModel):
    customer_id: str
    employee_id: Optional[int] = None
    order_date: Optional[date] = None
    required_date: Optional[date] = None
    ship_via: Optional[int] = None
    freight: Decimal = Field(default=Decimal(0), ge=0)
    ship_name: Optional[str] = None
    ship_address: Optional[str] = None
    ship_city: Optional[str] = None
    ship_region: Optional[str] = None
    ship_postal_code: Optional[str] = None
    ship_country: Optional[str] = None
    order_details: List[OrderDetailCreate] = Field(..., min_length=1)

class OrderUpdate(BaseModel):
    customer_id: Optional[str] = None
    employee_id: Optional[int] = None
    order_date: Optional[date] = None
    required_date: Optional[date] = None
    shipped_date: Optional[date] = None
    ship_via: Optional[int] = None
    freight: Optional[Decimal] = None
    ship_name: Optional[str] = None
    ship_address: Optional[str] = None
    ship_city: Optional[str] = None
    ship_region: Optional[str] = None
    ship_postal_code: Optional[str] = None
    ship_country: Optional[str] = None
    order_details: Optional[List[OrderDetailCreate]] = None

class OrderDetailResponse(BaseModel):
    product_id: int
    product_name: Optional[str] = None # Filled from relationship
    unit_price: Decimal
    quantity: int
    discount: Decimal
    line_total: Decimal
    discount_amount: Decimal
    final_total: Decimal
    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    order_id: int
    customer: Optional[CustomerInfo] = None
    employee: Optional[EmployeeInfo] = None
    shipper: Optional[ShipperInfo] = None
    order_date: Optional[date]
    required_date: Optional[date]
    shipped_date: Optional[date]
    status: OrderStatus
    freight: Decimal
    subtotal: Decimal
    discount_total: Decimal
    total: Decimal
    order_details: List[OrderDetailResponse]
    
    ship_name: Optional[str] = None
    ship_address: Optional[str] = None
    ship_city: Optional[str] = None
    ship_region: Optional[str] = None
    ship_postal_code: Optional[str] = None
    ship_country: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class OrderListResponse(BaseModel):
    order_id: int
    customer: Optional[CustomerInfo] = None
    employee: Optional[EmployeeInfo] = None
    order_date: Optional[date]
    required_date: Optional[date]
    shipped_date: Optional[date]
    status: OrderStatus
    total: Decimal
    model_config = ConfigDict(from_attributes=True)
