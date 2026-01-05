# Prompt 11: Categories CRUD (Backend)

## Context
Beginning Phase 3: Core Entities. We start with Categories as the simplest entity to establish CRUD patterns that will be reused for all other entities.

## Prerequisites
- Completed Phase 2 (Authentication)
- Auth middleware working
- Database migrations functional

## Goals
1. Create Category model
2. Implement Category schemas with validation
3. Build Category service with CRUD operations
4. Create Category API endpoints
5. Implement pagination, sorting, search
6. Write comprehensive tests

---

## Prompt

```text
Implement the Categories entity with full CRUD operations, establishing patterns for all subsequent entities.

CATEGORY MODEL (backend/app/models/category.py):
Create the Category SQLAlchemy model:

```python
from sqlalchemy import Column, Integer, String, Text, LargeBinary
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin

class Category(Base, TimestampMixin):
    __tablename__ = "categories"
    
    category_id = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    picture = Column(LargeBinary, nullable=True)  # Store as binary, rarely used
    
    # Relationships
    products = relationship("Product", back_populates="category", lazy="dynamic")
    
    def __repr__(self):
        return f"<Category {self.category_name}>"
```

CATEGORY SCHEMAS (backend/app/schemas/category.py):
Create Pydantic schemas:

```python
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

class CategoryWithProducts(CategoryResponse):
    products: List["ProductSummary"] = []
    
# Forward reference for ProductSummary
from app.schemas.product import ProductSummary
CategoryWithProducts.model_rebuild()
```

CATEGORY SERVICE (backend/app/services/category_service.py):
Create service layer:

```python
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List, Tuple
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.utils.exceptions import NotFoundError, ConflictError

class CategoryService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, category_id: int) -> Optional[Category]:
        return self.db.query(Category).filter(
            Category.category_id == category_id
        ).first()
    
    def get_by_name(self, name: str) -> Optional[Category]:
        return self.db.query(Category).filter(
            func.lower(Category.category_name) == name.lower()
        ).first()
    
    def get_list(
        self,
        page: int = 1,
        page_size: int = 25,
        search: Optional[str] = None,
        sort_by: str = "category_name",
        sort_order: str = "asc"
    ) -> Tuple[List[Category], int]:
        """
        Get paginated list of categories with optional search and sorting.
        Returns (categories, total_count)
        """
        query = self.db.query(Category)
        
        # Search
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Category.category_name.ilike(search_filter),
                    Category.description.ilike(search_filter)
                )
            )
        
        # Get total count before pagination
        total = query.count()
        
        # Sorting
        sort_column = getattr(Category, sort_by, Category.category_name)
        if sort_order.lower() == "desc":
            sort_column = sort_column.desc()
        query = query.order_by(sort_column)
        
        # Pagination
        offset = (page - 1) * page_size
        categories = query.offset(offset).limit(page_size).all()
        
        return categories, total
    
    def create(self, data: CategoryCreate) -> Category:
        # Check for duplicate name
        if self.get_by_name(data.category_name):
            raise ConflictError(f"Category '{data.category_name}' already exists")
        
        category = Category(
            category_name=data.category_name,
            description=data.description
        )
        
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category
    
    def update(self, category_id: int, data: CategoryUpdate) -> Category:
        category = self.get_by_id(category_id)
        if not category:
            raise NotFoundError(f"Category with ID {category_id} not found")
        
        # Check for duplicate name if changing
        if data.category_name and data.category_name != category.category_name:
            existing = self.get_by_name(data.category_name)
            if existing and existing.category_id != category_id:
                raise ConflictError(f"Category '{data.category_name}' already exists")
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(category, field, value)
        
        self.db.commit()
        self.db.refresh(category)
        return category
    
    def delete(self, category_id: int) -> bool:
        category = self.get_by_id(category_id)
        if not category:
            raise NotFoundError(f"Category with ID {category_id} not found")
        
        # Check if category has products
        product_count = category.products.count()
        if product_count > 0:
            raise ConflictError(
                f"Cannot delete category with {product_count} products. "
                "Reassign or delete products first."
            )
        
        self.db.delete(category)
        self.db.commit()
        return True
    
    def get_product_count(self, category_id: int) -> int:
        category = self.get_by_id(category_id)
        return category.products.count() if category else 0
```

CATEGORY ROUTER (backend/app/routers/categories.py):
Create API endpoints:

```python
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.auth.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.category import (
    CategoryCreate, CategoryUpdate, 
    CategoryResponse, CategoryListResponse
)
from app.schemas.common import PaginatedResponse, PaginationInfo, MessageResponse
from app.services.category_service import CategoryService
from math import ceil

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=PaginatedResponse[CategoryListResponse])
def list_categories(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    sort_by: str = Query("category_name", regex="^(category_id|category_name|created_at)$"),
    sort_order: str = Query("asc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all categories with pagination, search, and sorting.
    
    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 25, max: 100)
    - **search**: Search in name and description
    - **sort_by**: Field to sort by
    - **sort_order**: asc or desc
    """
    service = CategoryService(db)
    categories, total = service.get_list(
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Add product counts
    result = []
    for cat in categories:
        cat_data = CategoryListResponse.model_validate(cat)
        cat_data.product_count = service.get_product_count(cat.category_id)
        result.append(cat_data)
    
    return PaginatedResponse(
        data=result,
        pagination=PaginationInfo(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=ceil(total / page_size) if total > 0 else 1,
            has_next=page * page_size < total,
            has_previous=page > 1
        )
    )

@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single category by ID."""
    service = CategoryService(db)
    category = service.get_by_id(category_id)
    
    if not category:
        from app.utils.exceptions import NotFoundError
        raise NotFoundError(f"Category with ID {category_id} not found")
    
    response = CategoryResponse.model_validate(category)
    response.product_count = service.get_product_count(category_id)
    return response

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """
    Create a new category.
    
    Requires: Admin or Manager role
    """
    service = CategoryService(db)
    category = service.create(data)
    response = CategoryResponse.model_validate(category)
    response.product_count = 0
    return response

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """
    Update an existing category.
    
    Requires: Admin or Manager role
    """
    service = CategoryService(db)
    category = service.update(category_id, data)
    response = CategoryResponse.model_validate(category)
    response.product_count = service.get_product_count(category_id)
    return response

@router.delete("/{category_id}", response_model=MessageResponse)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """
    Delete a category.
    
    Requires: Admin or Manager role
    Cannot delete categories with existing products.
    """
    service = CategoryService(db)
    service.delete(category_id)
    return MessageResponse(message=f"Category {category_id} deleted successfully")
```

UPDATE MAIN.PY:
Register categories router:

```python
from app.routers import auth, health, categories

app.include_router(categories.router, prefix="/api/v1")
```

DATABASE MIGRATION:
Create migration for categories:

```bash
alembic revision --autogenerate -m "create_categories_table"
alembic upgrade head
```

UNIT TESTS (backend/tests/unit/test_category_service.py):
```python
import pytest
from app.services.category_service import CategoryService
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.utils.exceptions import NotFoundError, ConflictError

class TestCategoryService:
    def test_create_category(self, db_session):
        service = CategoryService(db_session)
        data = CategoryCreate(
            category_name="Test Category",
            description="Test Description"
        )
        category = service.create(data)
        
        assert category.category_id is not None
        assert category.category_name == "Test Category"
        assert category.description == "Test Description"
    
    def test_create_duplicate_name(self, db_session):
        service = CategoryService(db_session)
        data = CategoryCreate(category_name="Duplicate")
        service.create(data)
        
        with pytest.raises(ConflictError):
            service.create(data)
    
    def test_get_by_id(self, db_session):
        service = CategoryService(db_session)
        created = service.create(CategoryCreate(category_name="Find Me"))
        found = service.get_by_id(created.category_id)
        
        assert found is not None
        assert found.category_id == created.category_id
    
    def test_get_by_id_not_found(self, db_session):
        service = CategoryService(db_session)
        found = service.get_by_id(99999)
        assert found is None
    
    def test_update_category(self, db_session):
        service = CategoryService(db_session)
        created = service.create(CategoryCreate(category_name="Original"))
        
        updated = service.update(
            created.category_id,
            CategoryUpdate(category_name="Updated")
        )
        
        assert updated.category_name == "Updated"
    
    def test_update_not_found(self, db_session):
        service = CategoryService(db_session)
        
        with pytest.raises(NotFoundError):
            service.update(99999, CategoryUpdate(category_name="New"))
    
    def test_delete_category(self, db_session):
        service = CategoryService(db_session)
        created = service.create(CategoryCreate(category_name="Delete Me"))
        
        result = service.delete(created.category_id)
        assert result is True
        assert service.get_by_id(created.category_id) is None
    
    def test_list_with_pagination(self, db_session):
        service = CategoryService(db_session)
        
        # Create multiple categories
        for i in range(10):
            service.create(CategoryCreate(category_name=f"Category {i}"))
        
        # Get first page
        categories, total = service.get_list(page=1, page_size=5)
        assert len(categories) == 5
        assert total == 10
        
        # Get second page
        categories, total = service.get_list(page=2, page_size=5)
        assert len(categories) == 5
    
    def test_list_with_search(self, db_session):
        service = CategoryService(db_session)
        service.create(CategoryCreate(category_name="Beverages"))
        service.create(CategoryCreate(category_name="Seafood"))
        
        categories, total = service.get_list(search="bev")
        assert total == 1
        assert categories[0].category_name == "Beverages"
```

INTEGRATION TESTS (backend/tests/integration/test_categories_api.py):
```python
import pytest
from fastapi.testclient import TestClient

class TestCategoriesAPI:
    def test_list_categories_unauthorized(self, client: TestClient):
        response = client.get("/api/v1/categories")
        assert response.status_code == 403
    
    def test_list_categories_authorized(self, client: TestClient, auth_token: str):
        response = client.get(
            "/api/v1/categories",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data
    
    def test_create_category_as_admin(self, client: TestClient, admin_token: str):
        response = client.post(
            "/api/v1/categories",
            json={"category_name": "New Category", "description": "Test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["category_name"] == "New Category"
    
    def test_create_category_as_employee(self, client: TestClient, auth_token: str):
        response = client.post(
            "/api/v1/categories",
            json={"category_name": "Unauthorized"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 403
    
    def test_get_single_category(self, client: TestClient, admin_token: str):
        # Create first
        create_response = client.post(
            "/api/v1/categories",
            json={"category_name": "Get Test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        category_id = create_response.json()["category_id"]
        
        # Get
        response = client.get(
            f"/api/v1/categories/{category_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["category_id"] == category_id
    
    def test_update_category(self, client: TestClient, admin_token: str):
        # Create
        create_response = client.post(
            "/api/v1/categories",
            json={"category_name": "Update Test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        category_id = create_response.json()["category_id"]
        
        # Update
        response = client.put(
            f"/api/v1/categories/{category_id}",
            json={"category_name": "Updated Name"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["category_name"] == "Updated Name"
    
    def test_delete_category(self, client: TestClient, admin_token: str):
        # Create
        create_response = client.post(
            "/api/v1/categories",
            json={"category_name": "Delete Test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        category_id = create_response.json()["category_id"]
        
        # Delete
        response = client.delete(
            f"/api/v1/categories/{category_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
```

VERIFICATION:
1. Run migration: docker-compose exec backend alembic upgrade head
2. Verify table: docker-compose exec db psql -U postgres -d northwind -c "\d categories"
3. Test endpoints:
   TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "Admin123!"}' | jq -r '.access_token')
   
   # Create
   curl -X POST http://localhost:8000/api/v1/categories \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"category_name": "Beverages", "description": "Soft drinks, coffees, teas"}'
   
   # List
   curl http://localhost:8000/api/v1/categories \
     -H "Authorization: Bearer $TOKEN"
   
4. Run tests: docker-compose exec backend pytest tests/ -v -k category

SUCCESS CRITERIA:
- Category model created
- CRUD operations work
- Pagination works correctly
- Search filters results
- Sorting works
- Role-based access enforced
- Cannot delete category with products
- All tests pass
```

---

## Verification Checklist

- [ ] Category model created with all fields
- [ ] Migration creates categories table
- [ ] CategoryService implements all CRUD
- [ ] Pagination returns correct data
- [ ] Search filters by name/description
- [ ] Sorting works for allowed fields
- [ ] Create requires Admin/Manager
- [ ] Update requires Admin/Manager
- [ ] Delete requires Admin/Manager
- [ ] Cannot delete category with products
- [ ] Unit tests pass
- [ ] Integration tests pass

---

## Next Step
Proceed to [Prompt 12: Categories UI Components](./12-categories-ui.md)
