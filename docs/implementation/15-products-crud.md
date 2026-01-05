# Prompt 15: Products CRUD with Relationships (Backend)

## Context
Products is the most complex core entity with relationships to Categories and Suppliers, plus additional business logic for stock management.

## Prerequisites
- Completed Prompts 11-14 (Categories and Suppliers)

## Goals
1. Create Product model with all Northwind fields
2. Implement relationships to Category and Supplier
3. Build advanced filtering (price range, stock status)
4. Add aggregated search across related entities
5. Implement soft delete and business rules

---

## Prompt

```text
Implement the Products entity with full Northwind schema and relationships.

PRODUCT MODEL (backend/app/models/product.py):
```python
from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin

class Product(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "products"
    
    product_id = Column(Integer, primary_key=True, autoincrement=True)
    product_name = Column(String(100), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.category_id"), nullable=True)
    quantity_per_unit = Column(String(50), nullable=True)
    unit_price = Column(Numeric(10, 2), nullable=True, default=0)
    units_in_stock = Column(Integer, nullable=True, default=0)
    units_on_order = Column(Integer, nullable=True, default=0)
    reorder_level = Column(Integer, nullable=True, default=0)
    discontinued = Column(Boolean, nullable=False, default=False)
    
    # Relationships
    category = relationship("Category", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")
    order_details = relationship("OrderDetail", back_populates="product", lazy="dynamic")
    
    @property
    def stock_status(self) -> str:
        if self.discontinued:
            return "discontinued"
        if self.units_in_stock == 0:
            return "out_of_stock"
        if self.units_in_stock <= self.reorder_level:
            return "low_stock"
        return "in_stock"
    
    def __repr__(self):
        return f"<Product {self.product_name}>"
```

PRODUCT SCHEMAS (backend/app/schemas/product.py):
```python
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class ProductBase(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=100)
    supplier_id: Optional[int] = None
    category_id: Optional[int] = None
    quantity_per_unit: Optional[str] = Field(None, max_length=50)
    unit_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
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
    unit_price: Optional[Decimal]
    units_in_stock: Optional[int]
    stock_status: str
    discontinued: bool
    
    model_config = ConfigDict(from_attributes=True)

class ProductSummary(BaseModel):
    product_id: int
    product_name: str
    unit_price: Optional[Decimal]
    model_config = ConfigDict(from_attributes=True)
```

PRODUCT SERVICE (backend/app/services/product_service.py):
```python
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import Optional, List, Tuple
from decimal import Decimal
from app.models.product import Product
from app.models.category import Category
from app.models.supplier import Supplier
from app.schemas.product import ProductCreate, ProductUpdate
from app.utils.exceptions import NotFoundError, ConflictError

class ProductService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, product_id: int) -> Optional[Product]:
        return self.db.query(Product).options(
            joinedload(Product.category),
            joinedload(Product.supplier)
        ).filter(
            Product.product_id == product_id,
            Product.deleted_at.is_(None)
        ).first()
    
    def get_list(
        self,
        page: int = 1,
        page_size: int = 25,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        supplier_id: Optional[int] = None,
        stock_status: Optional[str] = None,  # in_stock, low_stock, out_of_stock
        price_min: Optional[Decimal] = None,
        price_max: Optional[Decimal] = None,
        discontinued: Optional[bool] = None,
        sort_by: str = "product_name",
        sort_order: str = "asc"
    ) -> Tuple[List[Product], int]:
        query = self.db.query(Product).options(
            joinedload(Product.category),
            joinedload(Product.supplier)
        ).filter(Product.deleted_at.is_(None))
        
        # Search across product, category, and supplier names
        if search:
            search_filter = f"%{search}%"
            query = query.outerjoin(Category).outerjoin(Supplier).filter(
                or_(
                    Product.product_name.ilike(search_filter),
                    Category.category_name.ilike(search_filter),
                    Supplier.company_name.ilike(search_filter)
                )
            )
        
        # Filters
        if category_id:
            query = query.filter(Product.category_id == category_id)
        if supplier_id:
            query = query.filter(Product.supplier_id == supplier_id)
        if discontinued is not None:
            query = query.filter(Product.discontinued == discontinued)
        if price_min is not None:
            query = query.filter(Product.unit_price >= price_min)
        if price_max is not None:
            query = query.filter(Product.unit_price <= price_max)
        
        # Stock status filter
        if stock_status:
            if stock_status == "out_of_stock":
                query = query.filter(Product.units_in_stock == 0)
            elif stock_status == "low_stock":
                query = query.filter(
                    and_(
                        Product.units_in_stock > 0,
                        Product.units_in_stock <= Product.reorder_level
                    )
                )
            elif stock_status == "in_stock":
                query = query.filter(Product.units_in_stock > Product.reorder_level)
        
        total = query.count()
        
        # Sorting with relationship handling
        if sort_by == "category_name":
            query = query.outerjoin(Category)
            sort_column = Category.category_name
        elif sort_by == "supplier_name":
            query = query.outerjoin(Supplier)
            sort_column = Supplier.company_name
        else:
            sort_column = getattr(Product, sort_by, Product.product_name)
        
        if sort_order.lower() == "desc":
            sort_column = sort_column.desc()
        query = query.order_by(sort_column)
        
        offset = (page - 1) * page_size
        products = query.offset(offset).limit(page_size).all()
        
        return products, total
    
    def create(self, data: ProductCreate) -> Product:
        # Validate category exists
        if data.category_id:
            category = self.db.query(Category).filter(
                Category.category_id == data.category_id
            ).first()
            if not category:
                raise NotFoundError(f"Category {data.category_id} not found")
        
        # Validate supplier exists
        if data.supplier_id:
            supplier = self.db.query(Supplier).filter(
                Supplier.supplier_id == data.supplier_id,
                Supplier.deleted_at.is_(None)
            ).first()
            if not supplier:
                raise NotFoundError(f"Supplier {data.supplier_id} not found")
        
        product = Product(**data.model_dump())
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return self.get_by_id(product.product_id)
    
    def update(self, product_id: int, data: ProductUpdate) -> Product:
        product = self.get_by_id(product_id)
        if not product:
            raise NotFoundError(f"Product {product_id} not found")
        
        update_data = data.model_dump(exclude_unset=True)
        
        # Validate relationships if changing
        if "category_id" in update_data and update_data["category_id"]:
            category = self.db.query(Category).filter(
                Category.category_id == update_data["category_id"]
            ).first()
            if not category:
                raise NotFoundError(f"Category {update_data['category_id']} not found")
        
        if "supplier_id" in update_data and update_data["supplier_id"]:
            supplier = self.db.query(Supplier).filter(
                Supplier.supplier_id == update_data["supplier_id"],
                Supplier.deleted_at.is_(None)
            ).first()
            if not supplier:
                raise NotFoundError(f"Supplier {update_data['supplier_id']} not found")
        
        for field, value in update_data.items():
            setattr(product, field, value)
        
        self.db.commit()
        self.db.refresh(product)
        return self.get_by_id(product_id)
    
    def delete(self, product_id: int) -> bool:
        product = self.get_by_id(product_id)
        if not product:
            raise NotFoundError(f"Product {product_id} not found")
        
        # Check for order history (soft check - still allow delete)
        from datetime import datetime
        product.deleted_at = datetime.utcnow()
        self.db.commit()
        return True
    
    def discontinue(self, product_id: int) -> Product:
        """Mark product as discontinued instead of deleting."""
        product = self.get_by_id(product_id)
        if not product:
            raise NotFoundError(f"Product {product_id} not found")
        
        product.discontinued = True
        self.db.commit()
        self.db.refresh(product)
        return product
```

PRODUCT ROUTER (backend/app/routers/products.py):
Create full API with all filters and sorting options:
- GET /products - list with extensive filtering
- GET /products/{id} - single product with category/supplier
- POST /products - create (admin/manager)
- PUT /products/{id} - update (admin/manager)
- DELETE /products/{id} - soft delete (admin/manager)
- PATCH /products/{id}/discontinue - mark as discontinued

Add filter helper endpoints:
- GET /products/filters/price-range - get min/max prices

MIGRATION:
```bash
alembic revision --autogenerate -m "create_products_table"
alembic upgrade head
```

TESTS:
Comprehensive tests for:
- CRUD with relationships
- All filter combinations
- Stock status calculation
- Search across related entities
- FK validation on create/update
- Discontinue functionality

VERIFICATION:
1. Create products with category/supplier relations
2. Test all filter combinations
3. Verify search includes category/supplier names
4. Test discontinue endpoint
5. Verify soft delete

SUCCESS CRITERIA:
- Product model with all relationships
- Complex filtering works
- Stock status calculated correctly
- Search spans relationships
- All tests pass
```

---

## Next Step
Proceed to [Prompt 16: Products UI with Search, Filter, Sort, Pagination](./16-products-ui.md)
