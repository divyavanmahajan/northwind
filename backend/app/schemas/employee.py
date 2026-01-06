from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class EmployeeBase(BaseModel):
    last_name: str = Field(..., min_length=1, max_length=20)
    first_name: str = Field(..., min_length=1, max_length=10)
    title: Optional[str] = Field(None, max_length=30)
    title_of_courtesy: Optional[str] = Field(None, max_length=25)
    birth_date: Optional[datetime] = None
    hire_date: Optional[datetime] = None
    address: Optional[str] = Field(None, max_length=60)
    city: Optional[str] = Field(None, max_length=15)
    region: Optional[str] = Field(None, max_length=15)
    postal_code: Optional[str] = Field(None, max_length=10)
    country: Optional[str] = Field(None, max_length=15)
    home_phone: Optional[str] = Field(None, max_length=24)
    extension: Optional[str] = Field(None, max_length=4)
    notes: Optional[str] = None
    reports_to: Optional[int] = None
    photo_path: Optional[str] = Field(None, max_length=255)

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    last_name: Optional[str] = Field(None, min_length=1, max_length=20)
    first_name: Optional[str] = Field(None, min_length=1, max_length=10)
    title: Optional[str] = Field(None, max_length=30)
    title_of_courtesy: Optional[str] = Field(None, max_length=25)
    birth_date: Optional[datetime] = None
    hire_date: Optional[datetime] = None
    address: Optional[str] = Field(None, max_length=60)
    city: Optional[str] = Field(None, max_length=15)
    region: Optional[str] = Field(None, max_length=15)
    postal_code: Optional[str] = Field(None, max_length=10)
    country: Optional[str] = Field(None, max_length=15)
    home_phone: Optional[str] = Field(None, max_length=24)
    extension: Optional[str] = Field(None, max_length=4)
    notes: Optional[str] = None
    reports_to: Optional[int] = None
    photo_path: Optional[str] = Field(None, max_length=255)

from decimal import Decimal

class EmployeeStatistics(BaseModel):
    total_orders: int = 0
    orders_this_month: int = 0
    total_sales: Decimal = Decimal(0)
    average_order_value: Decimal = Decimal(0)

class ManagerInfo(BaseModel):
    employee_id: int
    full_name: str
    title: Optional[str]
    model_config = ConfigDict(from_attributes=True)

class SubordinateInfo(BaseModel):
    employee_id: int
    full_name: str
    title: Optional[str]
    model_config = ConfigDict(from_attributes=True)

class EmployeeInfo(BaseModel):
    employee_id: int
    last_name: str
    first_name: str
    model_config = ConfigDict(from_attributes=True)

class EmployeeResponse(EmployeeBase):
    employee_id: int
    created_at: datetime
    updated_at: datetime
    reports_to_name: Optional[str] = None
    
    # Hierarchy and Stats
    manager: Optional[ManagerInfo] = None
    subordinates: List[SubordinateInfo] = []
    statistics: EmployeeStatistics = EmployeeStatistics()
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    model_config = ConfigDict(from_attributes=True)

class EmployeeListResponse(BaseModel):
    employee_id: int
    last_name: str
    first_name: str
    title: Optional[str]
    city: Optional[str]
    country: Optional[str]
    reports_to_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
