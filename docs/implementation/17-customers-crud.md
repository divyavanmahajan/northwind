# Prompt 17: Customers CRUD (Backend)

## Context
Beginning Phase 4: Business Entities. Customers have relationships to Users (for customer accounts) and Orders.

## Prerequisites
- Completed Phase 3 (Core Entities)
- User model available for linking

## Goals
1. Create Customer model with user linking
2. Implement customer-specific data isolation
3. Build customer statistics (order counts, totals)
4. Add customer-to-user account linking

---

## Prompt

```text
Implement the Customers entity with user account linking and order statistics.

CUSTOMER MODEL (backend/app/models/customer.py):
```python
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin

class Customer(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "customers"
    
    customer_id = Column(String(5), primary_key=True)  # Northwind uses 5-char IDs
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
    
    # Link to user account (optional - for customer login)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True, unique=True)
    
    # Relationships
    user = relationship("User", backref="customer_profile")
    orders = relationship("Order", back_populates="customer", lazy="dynamic")
    
    def __repr__(self):
        return f"<Customer {self.company_name}>"
```

CUSTOMER SCHEMAS (backend/app/schemas/customer.py):
Include user linking and order statistics:

```python
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
```

CUSTOMER SERVICE (backend/app/services/customer_service.py):
Include data isolation for customer role:

```python
class CustomerService:
    def __init__(self, db: Session, current_user: Optional[User] = None):
        self.db = db
        self.current_user = current_user
    
    def _apply_access_filter(self, query):
        """Apply data isolation for customer role."""
        if self.current_user and self.current_user.role == UserRole.CUSTOMER:
            # Customers can only see their own data
            customer = self.db.query(Customer).filter(
                Customer.user_id == self.current_user.user_id
            ).first()
            if customer:
                query = query.filter(Customer.customer_id == customer.customer_id)
            else:
                # No linked customer - return empty
                query = query.filter(False)
        return query
    
    def get_statistics(self, customer_id: str) -> CustomerStatistics:
        """Calculate customer order statistics."""
        from sqlalchemy import func
        from app.models.order import Order
        from app.models.order_detail import OrderDetail
        
        # Get order stats
        stats_query = self.db.query(
            func.count(Order.order_id).label('total_orders'),
            func.min(Order.order_date).label('first_order'),
            func.max(Order.order_date).label('last_order')
        ).filter(
            Order.customer_id == customer_id,
            Order.deleted_at.is_(None)
        ).first()
        
        # Get total spent
        total_query = self.db.query(
            func.sum(OrderDetail.unit_price * OrderDetail.quantity * (1 - OrderDetail.discount))
        ).join(Order).filter(
            Order.customer_id == customer_id,
            Order.deleted_at.is_(None)
        ).scalar() or Decimal(0)
        
        total_orders = stats_query.total_orders or 0
        
        return CustomerStatistics(
            total_orders=total_orders,
            total_spent=Decimal(str(total_query)),
            average_order_value=Decimal(str(total_query / total_orders)) if total_orders > 0 else Decimal(0),
            first_order_date=stats_query.first_order,
            last_order_date=stats_query.last_order
        )
    
    def get_for_current_user(self) -> Optional[Customer]:
        """Get customer profile for currently logged in customer user."""
        if not self.current_user:
            return None
        return self.db.query(Customer).filter(
            Customer.user_id == self.current_user.user_id,
            Customer.deleted_at.is_(None)
        ).first()
    
    # Standard CRUD methods with _apply_access_filter...
```

CUSTOMER ROUTER (backend/app/routers/customers.py):
Apply role-based filtering:

```python
@router.get("", response_model=PaginatedResponse[CustomerListResponse])
def list_customers(
    # ... params
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List customers. 
    - Admin/Manager: See all customers
    - Employee: See all customers (read-only)
    - Customer: See only own customer profile
    """
    service = CustomerService(db, current_user)
    # Service automatically filters based on role
    ...

@router.get("/me", response_model=CustomerResponse)
def get_my_customer_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's customer profile (for customer role)."""
    service = CustomerService(db, current_user)
    customer = service.get_for_current_user()
    if not customer:
        raise NotFoundError("No customer profile linked to your account")
    return customer
```

MIGRATION:
```bash
alembic revision --autogenerate -m "create_customers_table"
alembic upgrade head
```

TESTS:
- CRUD operations
- Data isolation for customer role
- Statistics calculation
- User linking
- Customer-only endpoints

SUCCESS CRITERIA:
- Customer model with user linking
- Data isolation works for customer role
- Statistics calculated correctly
- /me endpoint works for customers
```

---

## Next Step
Proceed to [Prompt 18: Customers UI Components](./18-customers-ui.md)
