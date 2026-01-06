from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List, Tuple
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.utils.exceptions import NotFoundError, ConflictError
from datetime import datetime

class EmployeeService:
    def __init__(self, db: Session):
        self.db = db
    
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
