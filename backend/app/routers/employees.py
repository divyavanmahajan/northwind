from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.auth.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate,
    EmployeeResponse, EmployeeListResponse,
    EmployeeStatistics, ManagerInfo, SubordinateInfo
)
from app.schemas.common import PaginatedResponse, PaginationInfo, MessageResponse
from app.services.employee_service import EmployeeService
from math import ceil
from app.utils.exceptions import NotFoundError

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("/org-tree", response_model=List[dict])
def get_org_tree(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get organization hierarchy tree."""
    service = EmployeeService(db)
    return service.get_org_tree()

@router.get("/managers", response_model=List[EmployeeListResponse])
def get_managers(
    exclude: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available managers."""
    service = EmployeeService(db)
    managers = service.get_available_managers(exclude_id=exclude)
    return [EmployeeListResponse.model_validate(m) for m in managers]

@router.get("", response_model=PaginatedResponse[EmployeeListResponse])
def list_employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    title: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    sort_by: str = Query("last_name"),
    sort_order: str = Query("asc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List employees with pagination, search, and filtering."""
    service = EmployeeService(db)
    employees, total = service.get_list(
        page=page, page_size=page_size,
        search=search, title=title, city=city, country=country,
        sort_by=sort_by, sort_order=sort_order
    )
    
    result = []
    for emp in employees:
        emp_data = EmployeeListResponse.model_validate(emp)
        if emp.reports_to:
            manager = service.get_by_id(emp.reports_to)
            if manager:
                emp_data.reports_to_name = f"{manager.first_name} {manager.last_name}"
        result.append(emp_data)
    
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

@router.get("/filters/titles", response_model=List[str])
def get_titles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of distinct titles for filtering."""
    service = EmployeeService(db)
    return service.get_titles()

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single employee by ID."""
    service = EmployeeService(db)
    employee = service.get_by_id(employee_id)
    if not employee:
        raise NotFoundError(f"Employee with ID {employee_id} not found")
    
    response = EmployeeResponse.model_validate(employee)
    
    # Fill Manager info
    if employee.reports_to:
        manager = service.get_by_id(employee.reports_to)
        if manager:
            response.reports_to_name = f"{manager.first_name} {manager.last_name}"
            response.manager = ManagerInfo(
                employee_id=manager.employee_id,
                full_name=f"{manager.first_name} {manager.last_name}",
                title=manager.title
            )

    # Fill Subordinates
    # employee.reports contains subordinates (dynamic query)
    subordinates = employee.reports.all()
    response.subordinates = [
        SubordinateInfo(
            employee_id=sub.employee_id,
            full_name=f"{sub.first_name} {sub.last_name}",
            title=sub.title
        ) for sub in subordinates
    ]

    # Fill Statistics
    response.statistics = service.get_statistics(employee.employee_id)
    
    return response

@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Create a new employee. Requires Admin or Manager role."""
    service = EmployeeService(db)
    employee = service.create(data)
    
    response = EmployeeResponse.model_validate(employee)
    if employee.reports_to:
        manager = service.get_by_id(employee.reports_to)
        if manager:
            response.reports_to_name = f"{manager.first_name} {manager.last_name}"
    return response

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Update employee. Requires Admin or Manager role."""
    service = EmployeeService(db)
    employee = service.update(employee_id, data)
    
    response = EmployeeResponse.model_validate(employee)
    if employee.reports_to:
        manager = service.get_by_id(employee.reports_to)
        if manager:
            response.reports_to_name = f"{manager.first_name} {manager.last_name}"
    return response

@router.delete("/{employee_id}", response_model=MessageResponse)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Soft delete employee. Requires Admin or Manager role."""
    service = EmployeeService(db)
    service.delete(employee_id)
    return MessageResponse(message=f"Employee {employee_id} deleted successfully")
