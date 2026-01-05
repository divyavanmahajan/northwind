# Prompt 13: Suppliers CRUD (Backend)

## Context
Building on the Categories pattern, we implement Suppliers with additional address and contact fields.

## Prerequisites
- Completed Prompt 12 (Categories UI)
- Categories CRUD working end-to-end

## Goals
1. Create Supplier model with full Northwind schema
2. Implement Supplier service with CRUD
3. Build API endpoints with filtering
4. Enable search across multiple fields
5. Write comprehensive tests

---

## Prompt

```text
Implement the Suppliers entity CRUD following the established Categories pattern but with additional complexity.

SUPPLIER MODEL (backend/app/models/supplier.py):
Create the Supplier model with full Northwind fields:

```python
from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin

class Supplier(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "suppliers"
    
    supplier_id = Column(Integer, primary_key=True, autoincrement=True)
    company_name = Column(String(100), nullable=False, index=True)
    contact_name = Column(String(100), nullable=True)
    contact_title = Column(String(50), nullable=True)
    address = Column(String(200), nullable=True)
    city = Column(String(50), nullable=True, index=True)
    region = Column(String(50), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(50), nullable=True, index=True)
    phone = Column(String(30), nullable=True)
    fax = Column(String(30), nullable=True)
    homepage = Column(Text, nullable=True)
    
    # Relationships
    products = relationship("Product", back_populates="supplier", lazy="dynamic")
    
    def __repr__(self):
        return f"<Supplier {self.company_name}>"
```

SUPPLIER SCHEMAS (backend/app/schemas/supplier.py):
```python
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
```

SUPPLIER SERVICE (backend/app/services/supplier_service.py):
Implement full CRUD with filtering:

```python
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List, Tuple
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate
from app.utils.exceptions import NotFoundError, ConflictError

class SupplierService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, supplier_id: int) -> Optional[Supplier]:
        return self.db.query(Supplier).filter(
            Supplier.supplier_id == supplier_id,
            Supplier.deleted_at.is_(None)
        ).first()
    
    def get_list(
        self,
        page: int = 1,
        page_size: int = 25,
        search: Optional[str] = None,
        country: Optional[str] = None,
        city: Optional[str] = None,
        sort_by: str = "company_name",
        sort_order: str = "asc"
    ) -> Tuple[List[Supplier], int]:
        query = self.db.query(Supplier).filter(Supplier.deleted_at.is_(None))
        
        # Search across multiple fields
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Supplier.company_name.ilike(search_filter),
                    Supplier.contact_name.ilike(search_filter),
                    Supplier.city.ilike(search_filter),
                    Supplier.country.ilike(search_filter)
                )
            )
        
        # Filters
        if country:
            query = query.filter(Supplier.country == country)
        if city:
            query = query.filter(Supplier.city == city)
        
        total = query.count()
        
        # Sorting
        sort_column = getattr(Supplier, sort_by, Supplier.company_name)
        if sort_order.lower() == "desc":
            sort_column = sort_column.desc()
        query = query.order_by(sort_column)
        
        # Pagination
        offset = (page - 1) * page_size
        suppliers = query.offset(offset).limit(page_size).all()
        
        return suppliers, total
    
    def get_countries(self) -> List[str]:
        """Get distinct countries for filter dropdown."""
        result = self.db.query(Supplier.country).filter(
            Supplier.country.isnot(None),
            Supplier.deleted_at.is_(None)
        ).distinct().order_by(Supplier.country).all()
        return [r[0] for r in result]
    
    def get_cities(self, country: Optional[str] = None) -> List[str]:
        """Get distinct cities for filter dropdown."""
        query = self.db.query(Supplier.city).filter(
            Supplier.city.isnot(None),
            Supplier.deleted_at.is_(None)
        )
        if country:
            query = query.filter(Supplier.country == country)
        result = query.distinct().order_by(Supplier.city).all()
        return [r[0] for r in result]
    
    def create(self, data: SupplierCreate) -> Supplier:
        supplier = Supplier(**data.model_dump())
        self.db.add(supplier)
        self.db.commit()
        self.db.refresh(supplier)
        return supplier
    
    def update(self, supplier_id: int, data: SupplierUpdate) -> Supplier:
        supplier = self.get_by_id(supplier_id)
        if not supplier:
            raise NotFoundError(f"Supplier with ID {supplier_id} not found")
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(supplier, field, value)
        
        self.db.commit()
        self.db.refresh(supplier)
        return supplier
    
    def delete(self, supplier_id: int) -> bool:
        """Soft delete supplier."""
        supplier = self.get_by_id(supplier_id)
        if not supplier:
            raise NotFoundError(f"Supplier with ID {supplier_id} not found")
        
        # Check for products
        product_count = supplier.products.count()
        if product_count > 0:
            raise ConflictError(
                f"Cannot delete supplier with {product_count} products. "
                "Reassign products first."
            )
        
        from datetime import datetime
        supplier.deleted_at = datetime.utcnow()
        self.db.commit()
        return True
    
    def get_product_count(self, supplier_id: int) -> int:
        supplier = self.get_by_id(supplier_id)
        return supplier.products.filter_by(deleted_at=None).count() if supplier else 0
```

SUPPLIER ROUTER (backend/app/routers/suppliers.py):
```python
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
    sort_order: str = Query("asc", regex="^(asc|desc)$"),
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
```

MIGRATION:
```bash
alembic revision --autogenerate -m "create_suppliers_table"
alembic upgrade head
```

REGISTER ROUTER:
```python
from app.routers import suppliers
app.include_router(suppliers.router, prefix="/api/v1")
```

TESTS:
Create comprehensive tests following the pattern from categories:

1. backend/tests/unit/test_supplier_service.py
2. backend/tests/integration/test_suppliers_api.py

Test scenarios:
- CRUD operations
- Soft delete functionality
- Search across multiple fields
- Country/city filtering
- Cannot delete supplier with products
- Role-based access control

VERIFICATION:
1. Run migration
2. Test all endpoints with curl
3. Verify soft delete works
4. Test filter dropdowns
5. Run all tests

SUCCESS CRITERIA:
- Supplier model with all Northwind fields
- Soft delete implemented
- Multi-field search works
- Country/city filter endpoints work
- Role-based access enforced
- All tests pass
```

---

## Next Step
Proceed to [Prompt 14: Suppliers UI Components](./14-suppliers-ui.md)
