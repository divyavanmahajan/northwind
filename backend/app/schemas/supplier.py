from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class SupplierBase(BaseModel):
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
    homepage: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1, max_length=100)
    contact_name: Optional[str] = Field(None, max_length=100)
    contact_title: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = Field(None, max_length=50)
    region: Optional[str] = Field(None, max_length=50)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=30)
    fax: Optional[str] = Field(None, max_length=30)
    homepage: Optional[str] = None

class SupplierResponse(SupplierBase):
    supplier_id: int
    product_count: int = 0
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class SupplierListResponse(BaseModel):
    supplier_id: int
    company_name: str
    contact_name: Optional[str]
    city: Optional[str]
    country: Optional[str]
    phone: Optional[str]
    product_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)
