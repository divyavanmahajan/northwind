from pydantic import BaseModel, ConfigDict
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
    users_by_role: dict
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
