from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal

class CustomerBase(BaseModel):
    customer_id: str = Field(..., min_length=1, max_length=5)
    company_name: str = Field(..., min_length=1, max_length=100)
    contact_name: Optional[str] = Field(None, max_length=100)
    contact_title: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = Field(None, max_length=50)
    region: Optional[str] = Field(None, max_length=50)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=30)
    fax: Optional[str] = Field(None, max_length=30)

class CustomerCreate(CustomerBase):
    user_id: Optional[UUID] = None  # Optional link to user account

class CustomerUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1, max_length=100)
    contact_name: Optional[str] = None
    contact_title: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    fax: Optional[str] = None
    user_id: Optional[UUID] = None

class CustomerStatistics(BaseModel):
    total_orders: int = 0
    total_spent: Decimal = Decimal(0)
    average_order_value: Decimal = Decimal(0)
    first_order_date: Optional[datetime] = None
    last_order_date: Optional[datetime] = None

class CustomerResponse(CustomerBase):
    user_id: Optional[UUID] = None
    statistics: CustomerStatistics = CustomerStatistics()
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class CustomerListResponse(BaseModel):
    customer_id: str
    company_name: str
    contact_name: Optional[str]
    city: Optional[str]
    country: Optional[str]
    phone: Optional[str]
    order_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)

class CustomerInfo(BaseModel):
    customer_id: str
    company_name: str
    contact_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
