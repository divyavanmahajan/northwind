from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.dashboard import AdminDashboard, ManagerDashboard, EmployeeDashboard, CustomerDashboard
from app.services.dashboard_service import DashboardService
from app.utils.exceptions import AuthorizationError

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/admin", response_model=AdminDashboard)
def get_admin_dashboard(
    period: str = Query("30d", pattern="^(7d|30d|90d|1y|all)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Get admin dashboard with comprehensive metrics."""
    service = DashboardService(db, current_user)
    return service.get_admin_dashboard(period)

@router.get("/manager", response_model=ManagerDashboard)
def get_manager_dashboard(
    period: str = Query("30d", pattern="^(7d|30d|90d|1y|all)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Get manager dashboard with sales and customer metrics."""
    service = DashboardService(db, current_user)
    return service.get_manager_dashboard(period)

@router.get("/employee", response_model=EmployeeDashboard)
def get_employee_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))
):
    """Get employee dashboard with product and inventory info."""
    service = DashboardService(db, current_user)
    return service.get_employee_dashboard()

@router.get("/customer", response_model=CustomerDashboard)
def get_customer_dashboard(
    period: str = Query("30d", pattern="^(7d|30d|90d|1y|all)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get customer dashboard with personal order history and stats."""
    if current_user.role != UserRole.CUSTOMER:
        raise AuthorizationError("Only customers can access this dashboard")
    service = DashboardService(db, current_user)
    return service.get_customer_dashboard(period)
