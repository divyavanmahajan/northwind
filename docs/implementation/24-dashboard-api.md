# Prompt 24: Dashboard API Endpoints

## Context
Build role-specific dashboard endpoints providing aggregated metrics and insights.

## Prerequisites
- Completed Prompt 23 (Data Seeding)
- Database populated with Northwind data

## Goals
1. Create admin dashboard metrics
2. Create manager dashboard metrics
3. Create employee dashboard metrics
4. Create customer dashboard metrics
5. Implement time-range parameters

---

## Prompt

```text
Implement role-specific dashboard API endpoints with aggregated metrics.

DASHBOARD SCHEMAS (backend/app/schemas/dashboard.py):
```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from decimal import Decimal

class TimeRange(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    period: str = "30d"  # 7d, 30d, 90d, 1y

class SalesMetric(BaseModel):
    total_orders: int
    total_revenue: Decimal
    average_order_value: Decimal
    orders_change_percent: float  # vs previous period

class TopProduct(BaseModel):
    product_id: int
    product_name: str
    total_quantity: int
    total_revenue: Decimal

class TopCustomer(BaseModel):
    customer_id: str
    company_name: str
    total_orders: int
    total_spent: Decimal

class LowStockProduct(BaseModel):
    product_id: int
    product_name: str
    units_in_stock: int
    reorder_level: int
    category_name: str

class OrdersByStatus(BaseModel):
    status: str
    count: int

class RevenueByPeriod(BaseModel):
    period: str  # e.g., "2026-01" for month
    revenue: Decimal
    orders: int

class UserStats(BaseModel):
    total_users: int
    users_by_role: dict[str, int]
    active_users: int
    inactive_users: int

# Role-specific responses
class AdminDashboard(BaseModel):
    user_stats: UserStats
    sales_overview: SalesMetric
    revenue_trend: List[RevenueByPeriod]
    orders_by_status: List[OrdersByStatus]
    top_products: List[TopProduct]
    low_stock_alerts: List[LowStockProduct]

class ManagerDashboard(BaseModel):
    sales_overview: SalesMetric
    revenue_trend: List[RevenueByPeriod]
    orders_by_status: List[OrdersByStatus]
    top_products: List[TopProduct]
    top_customers: List[TopCustomer]
    low_stock_alerts: List[LowStockProduct]
    recent_orders: List[dict]

class EmployeeDashboard(BaseModel):
    total_products: int
    total_categories: int
    total_suppliers: int
    recent_orders: List[dict]
    product_inventory: List[dict]

class CustomerDashboard(BaseModel):
    my_stats: SalesMetric
    order_status_breakdown: List[OrdersByStatus]
    recent_orders: List[dict]
    favorite_products: List[TopProduct]
```

DASHBOARD SERVICE (backend/app/services/dashboard_service.py):
```python
from sqlalchemy import func, case, and_
from datetime import date, timedelta
from decimal import Decimal

class DashboardService:
    def __init__(self, db: Session, current_user: User):
        self.db = db
        self.user = current_user
    
    def _get_date_range(self, period: str) -> tuple[date, date]:
        end = date.today()
        days_map = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
        start = end - timedelta(days=days_map.get(period, 30))
        return start, end
    
    def get_sales_overview(self, start: date, end: date) -> SalesMetric:
        # Current period
        current = self.db.query(
            func.count(Order.order_id),
            func.coalesce(func.sum(OrderDetail.unit_price * OrderDetail.quantity * (1 - OrderDetail.discount)), 0)
        ).join(OrderDetail).filter(
            Order.order_date >= start,
            Order.order_date <= end,
            Order.deleted_at.is_(None)
        ).first()
        
        # Previous period for comparison
        period_days = (end - start).days
        prev_start = start - timedelta(days=period_days)
        prev_end = start - timedelta(days=1)
        
        previous = self.db.query(
            func.count(Order.order_id)
        ).filter(
            Order.order_date >= prev_start,
            Order.order_date <= prev_end,
            Order.deleted_at.is_(None)
        ).scalar() or 0
        
        total_orders = current[0] or 0
        total_revenue = Decimal(str(current[1] or 0))
        
        change = ((total_orders - previous) / previous * 100) if previous > 0 else 0
        
        return SalesMetric(
            total_orders=total_orders,
            total_revenue=total_revenue,
            average_order_value=total_revenue / total_orders if total_orders > 0 else Decimal(0),
            orders_change_percent=round(change, 1)
        )
    
    def get_revenue_trend(self, start: date, end: date) -> List[RevenueByPeriod]:
        results = self.db.query(
            func.to_char(Order.order_date, 'YYYY-MM').label('period'),
            func.coalesce(func.sum(OrderDetail.unit_price * OrderDetail.quantity * (1 - OrderDetail.discount)), 0).label('revenue'),
            func.count(func.distinct(Order.order_id)).label('orders')
        ).join(OrderDetail).filter(
            Order.order_date >= start,
            Order.order_date <= end,
            Order.deleted_at.is_(None)
        ).group_by('period').order_by('period').all()
        
        return [RevenueByPeriod(period=r.period, revenue=Decimal(str(r.revenue)), orders=r.orders) for r in results]
    
    def get_orders_by_status(self) -> List[OrdersByStatus]:
        results = self.db.query(
            Order.status,
            func.count(Order.order_id)
        ).filter(Order.deleted_at.is_(None)).group_by(Order.status).all()
        
        return [OrdersByStatus(status=r[0].value, count=r[1]) for r in results]
    
    def get_top_products(self, limit: int = 10) -> List[TopProduct]:
        results = self.db.query(
            Product.product_id,
            Product.product_name,
            func.sum(OrderDetail.quantity).label('total_qty'),
            func.sum(OrderDetail.unit_price * OrderDetail.quantity * (1 - OrderDetail.discount)).label('revenue')
        ).join(OrderDetail).join(Order).filter(
            Order.deleted_at.is_(None)
        ).group_by(Product.product_id, Product.product_name
        ).order_by(func.sum(OrderDetail.quantity).desc()
        ).limit(limit).all()
        
        return [TopProduct(
            product_id=r.product_id,
            product_name=r.product_name,
            total_quantity=r.total_qty,
            total_revenue=Decimal(str(r.revenue))
        ) for r in results]
    
    def get_low_stock_products(self, limit: int = 10) -> List[LowStockProduct]:
        results = self.db.query(Product).options(
            joinedload(Product.category)
        ).filter(
            Product.units_in_stock <= Product.reorder_level,
            Product.units_in_stock > 0,
            Product.discontinued == False,
            Product.deleted_at.is_(None)
        ).order_by(Product.units_in_stock).limit(limit).all()
        
        return [LowStockProduct(
            product_id=p.product_id,
            product_name=p.product_name,
            units_in_stock=p.units_in_stock,
            reorder_level=p.reorder_level,
            category_name=p.category.category_name if p.category else ''
        ) for p in results]
    
    def get_admin_dashboard(self, period: str = "30d") -> AdminDashboard:
        start, end = self._get_date_range(period)
        
        return AdminDashboard(
            user_stats=self.get_user_stats(),
            sales_overview=self.get_sales_overview(start, end),
            revenue_trend=self.get_revenue_trend(start, end),
            orders_by_status=self.get_orders_by_status(),
            top_products=self.get_top_products(10),
            low_stock_alerts=self.get_low_stock_products(10)
        )
    
    # Similar methods for manager, employee, customer dashboards...
```

DASHBOARD ROUTER (backend/app/routers/dashboard.py):
```python
@router.get("/admin", response_model=AdminDashboard)
def get_admin_dashboard(
    period: str = Query("30d", regex="^(7d|30d|90d|1y)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    service = DashboardService(db, current_user)
    return service.get_admin_dashboard(period)

@router.get("/manager", response_model=ManagerDashboard)
def get_manager_dashboard(
    period: str = Query("30d", regex="^(7d|30d|90d|1y)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    service = DashboardService(db, current_user)
    return service.get_manager_dashboard(period)

@router.get("/employee", response_model=EmployeeDashboard)
def get_employee_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))
):
    service = DashboardService(db, current_user)
    return service.get_employee_dashboard()

@router.get("/customer", response_model=CustomerDashboard)
def get_customer_dashboard(
    period: str = Query("30d", regex="^(7d|30d|90d|1y)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CUSTOMER:
        raise AuthorizationError("Only customers can access this dashboard")
    service = DashboardService(db, current_user)
    return service.get_customer_dashboard(period)
```

TESTS:
- Each dashboard endpoint returns correct structure
- Time range filtering works
- Role access control enforced
- Customer dashboard only shows own data
- Metrics calculate correctly

VERIFICATION:
1. Seed database first
2. Test each endpoint with appropriate role
3. Verify metrics match manual SQL queries

SUCCESS CRITERIA:
- All four dashboard endpoints work
- Time range parameter filters data
- Metrics calculate correctly
- Role-based access enforced
```

---

## Next Step
Proceed to [Prompt 25: Dashboard UI Components with Charts](./25-dashboard-ui.md)
