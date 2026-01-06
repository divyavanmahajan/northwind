from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List, Tuple
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeStatistics
from app.utils.exceptions import NotFoundError, ConflictError
from datetime import datetime, timedelta

class EmployeeService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_org_tree(self) -> List[dict]:
        """Get organization tree starting from top-level employees."""
        # Top level employees have no manager (reports_to is None)
        top_level = self.db.query(Employee).filter(
            Employee.reports_to.is_(None),
            Employee.deleted_at.is_(None)
        ).all()
        
        def build_tree(employee: Employee) -> dict:
            # Recursively build tree
            # Note: using 'reports' relationship which contains subordinates
            # We must convert the dynamic query to a list for iteration
            subordinates = employee.reports.filter(Employee.deleted_at.is_(None)).all()
            
            return {
                "employee_id": employee.employee_id,
                "name": f"{employee.first_name} {employee.last_name}",
                "title": employee.title,
                "subordinates": [
                    build_tree(sub) 
                    for sub in subordinates
                ]
            }
        
        return [build_tree(emp) for emp in top_level]
    
    def get_available_managers(self, exclude_id: Optional[int] = None) -> List[Employee]:
        """Get employees who can be managers (for dropdown)."""
        query = self.db.query(Employee).filter(Employee.deleted_at.is_(None))
        if exclude_id:
            # Can't report to self
            query = query.filter(Employee.employee_id != exclude_id)
            # ideally also exclude own subordinates to prevent cycles, but doing simpler check for now
        return query.order_by(Employee.last_name).all()
    
    def get_statistics(self, employee_id: int) -> EmployeeStatistics:
        """Calculate employee order statistics."""
        from app.models.order import Order
        from app.models.order_detail import OrderDetail
        from decimal import Decimal
        
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
        # We need to join OrderDetail
        sales = self.db.query(
            func.sum(OrderDetail.unit_price * OrderDetail.quantity * (1 - OrderDetail.discount))
        ).select_from(Order).join(OrderDetail).filter(
            Order.employee_id == employee_id,
            Order.deleted_at.is_(None)
        ).scalar() or Decimal(0)
        
        return EmployeeStatistics(
            total_orders=total,
            orders_this_month=this_month,
            total_sales=Decimal(str(sales)),
            average_order_value=Decimal(str(sales / total)) if total > 0 else Decimal(0)
        )

    def get_by_id(self, employee_id: int) -> Optional[Employee]:
        return self.db.query(Employee).filter(
            Employee.employee_id == employee_id,
            Employee.deleted_at.is_(None)
        ).first()
    
    def get_list(
        self,
        page: int = 1,
        page_size: int = 25,
        search: Optional[str] = None,
        title: Optional[str] = None,
        city: Optional[str] = None,
        country: Optional[str] = None,
        sort_by: str = "last_name",
        sort_order: str = "asc"
    ) -> Tuple[List[Employee], int]:
        query = self.db.query(Employee).filter(Employee.deleted_at.is_(None))
        
        # Search
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Employee.last_name.ilike(search_filter),
                    Employee.first_name.ilike(search_filter),
                    Employee.title.ilike(search_filter)
                )
            )
        
        # Filters
        if title:
            query = query.filter(Employee.title == title)
        if city:
            query = query.filter(Employee.city == city)
        if country:
            query = query.filter(Employee.country == country)
        
        total = query.count()
        
        # Sorting
        sort_column = getattr(Employee, sort_by, Employee.last_name)
        if sort_order.lower() == "desc":
            sort_column = sort_column.desc()
        query = query.order_by(sort_column)
        
        # Pagination
        offset = (page - 1) * page_size
        employees = query.offset(offset).limit(page_size).all()
        
        return employees, total
    
    def get_titles(self) -> List[str]:
        """Get distinct titles for filter dropdown."""
        result = self.db.query(Employee.title).filter(
            Employee.title.isnot(None),
            Employee.deleted_at.is_(None)
        ).distinct().order_by(Employee.title).all()
        return [r[0] for r in result]

    def create(self, data: EmployeeCreate) -> Employee:
        # Validate reports_to
        if data.reports_to:
            manager = self.get_by_id(data.reports_to)
            if not manager:
                raise NotFoundError(f"Manager (reports_to) with ID {data.reports_to} not found")

        employee = Employee(**data.model_dump())
        self.db.add(employee)
        self.db.commit()
        self.db.refresh(employee)
        return employee
    
    def update(self, employee_id: int, data: EmployeeUpdate) -> Employee:
        employee = self.get_by_id(employee_id)
        if not employee:
            raise NotFoundError(f"Employee with ID {employee_id} not found")
        
        # Validate reports_to
        if data.reports_to is not None:
             if data.reports_to == employee_id:
                 raise ConflictError("Employee cannot report to themselves")
             
             manager = self.get_by_id(data.reports_to)
             if not manager:
                 raise NotFoundError(f"Manager (reports_to) with ID {data.reports_to} not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(employee, field, value)
        
        self.db.commit()
        self.db.refresh(employee)
        return employee
    
    def delete(self, employee_id: int) -> bool:
        """Soft delete employee."""
        employee = self.get_by_id(employee_id)
        if not employee:
            raise NotFoundError(f"Employee with ID {employee_id} not found")
        
        # Check for reports
        reports_count = employee.reports.filter(Employee.deleted_at.is_(None)).count()
        if reports_count > 0:
            raise ConflictError(
                f"Cannot delete employee with {reports_count} direct reports. "
                "Reassign reports first."
            )
        
        employee.deleted_at = datetime.utcnow()
        self.db.commit()
        return True
