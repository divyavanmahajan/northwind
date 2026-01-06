from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class ProductBase(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=100)
    supplier_id: Optional[int] = None
    category_id: Optional[int] = None
    quantity_per_unit: Optional[str] = Field(None, max_length=50)
    unit_price: Optional[Decimal] = Field(None, ge=0)
    units_in_stock: Optional[int] = Field(None, ge=0)
    units_on_order: Optional[int] = Field(None, ge=0)
    reorder_level: Optional[int] = Field(None, ge=0)
    discontinued: bool = False

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    product_name: Optional[str] = Field(None, min_length=1, max_length=100)
    supplier_id: Optional[int] = None
    category_id: Optional[int] = None
    quantity_per_unit: Optional[str] = None
    unit_price: Optional[Decimal] = Field(None, ge=0)
    units_in_stock: Optional[int] = Field(None, ge=0)
    units_on_order: Optional[int] = Field(None, ge=0)
    reorder_level: Optional[int] = Field(None, ge=0)
    discontinued: Optional[bool] = None

class CategoryInfo(BaseModel):
    category_id: int
    category_name: str
    model_config = ConfigDict(from_attributes=True)

class SupplierInfo(BaseModel):
    supplier_id: int
    company_name: str
    contact_name: Optional[str]
    model_config = ConfigDict(from_attributes=True)

class ProductResponse(ProductBase):
    product_id: int
    stock_status: str
    category: Optional[CategoryInfo] = None
    supplier: Optional[SupplierInfo] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ProductListResponse(BaseModel):
    product_id: int
    product_name: str
    category_name: Optional[str] = None
    supplier_name: Optional[str] = None
    unit_price: Optional[Decimal] = None
    units_in_stock: Optional[int] = None
    stock_status: str
    discontinued: bool
    
    model_config = ConfigDict(from_attributes=True)

    @field_validator('category_name', mode='before')
    @classmethod
    def get_category_name(cls, v, info):
        if hasattr(info.data.get('category'), 'category_name'):
            return info.data['category'].category_name
        return v

class ProductSummary(BaseModel):
    product_id: int
    product_name: str
    unit_price: Optional[Decimal]
    model_config = ConfigDict(from_attributes=True)
