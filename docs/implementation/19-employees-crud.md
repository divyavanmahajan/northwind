# Prompt 19: Employees CRUD (Backend)

## Context
Employees have self-referencing relationships (reports_to) and link to Users for authentication.

## Prerequisites
- Completed Prompt 18 (Customers UI)

## Goals
1. Create Employee model with self-referencing manager relationship
2. Link employees to user accounts
3. Calculate order statistics per employee
4. Build org chart data structure

---

## Prompt

```text
Implement Employees entity with hierarchical relationships and user linking.

EMPLOYEE MODEL (backend/app/models/employee.py):
```python
from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin

class Employee(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "employees"
    
    employee_id = Column(Integer, primary_key=True, autoincrement=True)
    last_name = Column(String(50), nullable=False, index=True)
    first_name = Column(String(50), nullable=False)
    title = Column(String(50), nullable=True)
    title_of_courtesy = Column(String(25), nullable=True)  # Mr., Ms., Dr., etc.
    birth_date = Column(Date, nullable=True)
    hire_date = Column(Date, nullable=True)
    address = Column(String(200), nullable=True)
    city = Column(String(50), nullable=True)
    region = Column(String(50), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(50), nullable=True)
    home_phone = Column(String(30), nullable=True)
    extension = Column(String(10), nullable=True)
    photo = Column(Text, nullable=True)  # Store as base64 or URL
    notes = Column(Text, nullable=True)
    photo_path = Column(String(255), nullable=True)
    
    # Self-referencing for org hierarchy
    reports_to = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    
    # Link to user account
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True, unique=True)
    
    # Relationships
    manager = relationship("Employee", remote_side=[employee_id], backref="subordinates")
    user = relationship("User", backref="employee_profile")
    orders = relationship("Order", back_populates="employee", lazy="dynamic")
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<Employee {self.full_name}>"
```

EMPLOYEE SCHEMAS (backend/app/schemas/employee.py):
Include hierarchy and statistics:

```python
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

class EmployeeResponse(EmployeeBase):
    employee_id: int
    full_name: str
    manager: Optional[ManagerInfo] = None
    subordinates: List[SubordinateInfo] = []
    statistics: EmployeeStatistics = EmployeeStatistics()
    user_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
```

EMPLOYEE SERVICE (backend/app/services/employee_service.py):
Include hierarchy queries:

```python
class EmployeeService:
    def get_org_tree(self) -> List[dict]:
        """Get organization tree starting from top-level employees."""
        top_level = self.db.query(Employee).filter(
            Employee.reports_to.is_(None),
            Employee.deleted_at.is_(None)
        ).all()
        
        def build_tree(employee: Employee) -> dict:
            return {
                "employee_id": employee.employee_id,
                "name": employee.full_name,
                "title": employee.title,
                "subordinates": [
                    build_tree(sub) 
                    for sub in employee.subordinates 
                    if sub.deleted_at is None
                ]
            }
        
        return [build_tree(emp) for emp in top_level]
    
    def get_available_managers(self, exclude_id: Optional[int] = None) -> List[Employee]:
        """Get employees who can be managers (for dropdown)."""
        query = self.db.query(Employee).filter(Employee.deleted_at.is_(None))
        if exclude_id:
            # Can't report to self or own subordinates
            query = query.filter(Employee.employee_id != exclude_id)
        return query.order_by(Employee.last_name).all()
    
    def get_statistics(self, employee_id: int) -> EmployeeStatistics:
        """Calculate employee order statistics."""
        from datetime import datetime, timedelta
        from sqlalchemy import func
        
        month_ago = datetime.utcnow() - timedelta(days=30)
        
        # Total orders
        total = self.db.query(func.count(Order.order_id)).filter(
            Order.employee_id == employee_id,
            Order.deleted_at.is_(None)
        ).scalar() or 0
        
        # Orders this month
        this_month = self.db.query(func.count(Order.order_id)).filter(
            Order.employee_id == employee_id,
            Order.order_date >= month_ago,
            Order.deleted_at.is_(None)
        ).scalar() or 0
        
        # Total sales (from order details)
        sales = self.db.query(
            func.sum(OrderDetail.unit_price * OrderDetail.quantity * (1 - OrderDetail.discount))
        ).join(Order).filter(
            Order.employee_id == employee_id,
            Order.deleted_at.is_(None)
        ).scalar() or Decimal(0)
        
        return EmployeeStatistics(
            total_orders=total,
            orders_this_month=this_month,
            total_sales=Decimal(str(sales)),
            average_order_value=Decimal(str(sales / total)) if total > 0 else Decimal(0)
        )
```

EMPLOYEE ROUTER:
Endpoints including:
- GET /employees/org-tree - Get organization hierarchy
- GET /employees/managers - Get available managers for dropdown
- Standard CRUD

ACCESS CONTROL:
- Admin: Full CRUD
- Manager: Read only
- Employee: Read only
- Customer: No access

MIGRATION AND TESTS:
Follow established patterns.

SUCCESS CRITERIA:
- Employee model with self-reference
- Org tree query works
- Manager dropdown populated
- Statistics calculated
- User linking works
```

---

## Next Step
Proceed to [Prompt 20: Employees UI Components](./20-employees-ui.md)
