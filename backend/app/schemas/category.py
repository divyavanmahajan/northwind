from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class CategoryBase(BaseModel):
    category_name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    category_name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None

class CategoryResponse(CategoryBase):
    category_id: int
    created_at: datetime
    updated_at: datetime
    product_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)

class CategoryListResponse(BaseModel):
    category_id: int
    category_name: str
    description: Optional[str]
    product_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)
