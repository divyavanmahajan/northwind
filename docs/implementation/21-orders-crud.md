# Prompt 21: Orders & Order Details CRUD (Backend)

## Context
Orders are the most complex entity with relationships to Customers, Employees, Shippers, and nested Order Details.

## Prerequisites
- Completed Prompts 17-20 (Customers and Employees)

## Goals
1. Create Order and OrderDetail models
2. Create Shippers model
3. Implement order creation with line items
4. Build order status workflow
5. Calculate order totals
6. Handle customer data isolation

---

## Prompt

```text
Implement Orders and Order Details with full Northwind relationships.

SHIPPER MODEL (backend/app/models/shipper.py):
```python
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Shipper(Base):
    __tablename__ = "shippers"
    
    shipper_id = Column(Integer, primary_key=True, autoincrement=True)
    company_name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=True)
    
    orders = relationship("Order", back_populates="shipper", lazy="dynamic")
```

ORDER MODEL (backend/app/models/order.py):
```python
from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin
import enum

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class Order(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "orders"
    
    order_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(String(5), ForeignKey("customers.customer_id"), nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    order_date = Column(Date, nullable=True, index=True)
    required_date = Column(Date, nullable=True)
    shipped_date = Column(Date, nullable=True)
    ship_via = Column(Integer, ForeignKey("shippers.shipper_id"), nullable=True)
    freight = Column(Numeric(10, 2), nullable=True, default=0)
    ship_name = Column(String(100), nullable=True)
    ship_address = Column(String(200), nullable=True)
    ship_city = Column(String(50), nullable=True)
    ship_region = Column(String(50), nullable=True)
    ship_postal_code = Column(String(20), nullable=True)
    ship_country = Column(String(50), nullable=True)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    
    # Relationships
    customer = relationship("Customer", back_populates="orders")
    employee = relationship("Employee", back_populates="orders")
    shipper = relationship("Shipper", back_populates="orders")
    order_details = relationship("OrderDetail", back_populates="order", cascade="all, delete-orphan")
    
    @property
    def subtotal(self) -> Decimal:
        return sum(d.line_total for d in self.order_details)
    
    @property
    def discount_total(self) -> Decimal:
        return sum(d.discount_amount for d in self.order_details)
    
    @property
    def total(self) -> Decimal:
        return self.subtotal - self.discount_total + Decimal(str(self.freight or 0))
```

ORDER DETAIL MODEL (backend/app/models/order_detail.py):
```python
from sqlalchemy import Column, Integer, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from decimal import Decimal

class OrderDetail(Base):
    __tablename__ = "order_details"
    
    order_id = Column(Integer, ForeignKey("orders.order_id"), primary_key=True)
    product_id = Column(Integer, ForeignKey("products.product_id"), primary_key=True)
    unit_price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    discount = Column(Numeric(4, 2), nullable=False, default=0)  # Stored as decimal (0.15 = 15%)
    
    # Relationships
    order = relationship("Order", back_populates="order_details")
    product = relationship("Product", back_populates="order_details")
    
    @property
    def line_total(self) -> Decimal:
        return Decimal(str(self.unit_price)) * self.quantity
    
    @property
    def discount_amount(self) -> Decimal:
        return self.line_total * Decimal(str(self.discount))
    
    @property
    def final_total(self) -> Decimal:
        return self.line_total - self.discount_amount
```

ORDER SCHEMAS (backend/app/schemas/order.py):
```python
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

class OrderDetailResponse(BaseModel):
    product_id: int
    product_name: str
    unit_price: Decimal
    quantity: int
    discount: Decimal
    line_total: Decimal
    discount_amount: Decimal
    final_total: Decimal
    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    order_id: int
    customer: CustomerInfo
    employee: Optional[EmployeeInfo]
    shipper: Optional[ShipperInfo]
    order_date: Optional[date]
    required_date: Optional[date]
    shipped_date: Optional[date]
    status: OrderStatus
    freight: Decimal
    subtotal: Decimal
    discount_total: Decimal
    total: Decimal
    order_details: List[OrderDetailResponse]
    # Shipping info...
    model_config = ConfigDict(from_attributes=True)
```

ORDER SERVICE (backend/app/services/order_service.py):
```python
class OrderService:
    def __init__(self, db: Session, current_user: Optional[User] = None):
        self.db = db
        self.current_user = current_user
    
    def _apply_access_filter(self, query):
        """Customer role can only see their own orders."""
        if self.current_user and self.current_user.role == UserRole.CUSTOMER:
            customer = self.db.query(Customer).filter(
                Customer.user_id == self.current_user.user_id
            ).first()
            if customer:
                query = query.filter(Order.customer_id == customer.customer_id)
            else:
                query = query.filter(False)
        return query
    
    def create(self, data: OrderCreate) -> Order:
        """Create order with order details."""
        order = Order(
            customer_id=data.customer_id,
            employee_id=data.employee_id,
            order_date=data.order_date or date.today(),
            required_date=data.required_date,
            ship_via=data.ship_via,
            freight=data.freight,
            ship_name=data.ship_name,
            ship_address=data.ship_address,
            ship_city=data.ship_city,
            ship_region=data.ship_region,
            ship_postal_code=data.ship_postal_code,
            ship_country=data.ship_country,
            status=OrderStatus.PENDING
        )
        
        self.db.add(order)
        self.db.flush()  # Get order_id
        
        # Add order details
        for detail in data.order_details:
            product = self.db.query(Product).filter(
                Product.product_id == detail.product_id
            ).first()
            if not product:
                raise NotFoundError(f"Product {detail.product_id} not found")
            
            order_detail = OrderDetail(
                order_id=order.order_id,
                product_id=detail.product_id,
                unit_price=detail.unit_price or product.unit_price,
                quantity=detail.quantity,
                discount=detail.discount
            )
            self.db.add(order_detail)
        
        self.db.commit()
        self.db.refresh(order)
        return order
    
    def update_status(self, order_id: int, new_status: OrderStatus) -> Order:
        """Update order status with validation."""
        order = self.get_by_id(order_id)
        if not order:
            raise NotFoundError(f"Order {order_id} not found")
        
        # Validate status transitions
        valid_transitions = {
            OrderStatus.PENDING: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
            OrderStatus.PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
            OrderStatus.SHIPPED: [OrderStatus.DELIVERED],
            OrderStatus.DELIVERED: [],
            OrderStatus.CANCELLED: [],
        }
        
        if new_status not in valid_transitions.get(order.status, []):
            raise ValidationError(
                f"Cannot transition from {order.status.value} to {new_status.value}"
            )
        
        order.status = new_status
        
        # Set shipped_date when marking as shipped
        if new_status == OrderStatus.SHIPPED:
            order.shipped_date = date.today()
        
        self.db.commit()
        return order
```

ORDER ROUTER:
- GET /orders - list with filters (status, customer, employee, date range)
- GET /orders/{id} - single order with all details
- POST /orders - create with line items
- PUT /orders/{id} - update order info
- PATCH /orders/{id}/status - update status
- DELETE /orders/{id} - soft delete

Filter endpoints:
- GET /orders/filters/statuses - get status options
- GET /orders/filters/shippers - get shipper options

SHIPPERS ROUTER:
Simple CRUD for shippers (admin/manager only).

MIGRATIONS:
```bash
alembic revision --autogenerate -m "create_shippers_table"
alembic revision --autogenerate -m "create_orders_and_order_details_tables"
alembic upgrade head
```

TESTS:
- Order creation with line items
- Status transitions
- Customer data isolation
- Order totals calculation
- Invalid status transitions rejected

SUCCESS CRITERIA:
- Order and OrderDetail models with relationships
- Order creation with line items works
- Status workflow enforced
- Totals calculated correctly
- Customer sees only own orders
```

---

## Next Step
Proceed to [Prompt 22: Orders UI with Detail View](./22-orders-ui.md)

This completes **Phase 4: Business Entities**.
