from sqlalchemy import func, and_
from sqlalchemy.orm import Session, joinedload
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Tuple
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus
from app.models.order_detail import OrderDetail
from app.models.product import Product
from app.models.customer import Customer
from app.models.category import Category
from app.models.supplier import Supplier
from app.schemas.dashboard import (
    SalesMetric, TopProduct, TopCustomer, LowStockProduct,
    OrdersByStatus, RevenueByPeriod, UserStats,
    AdminDashboard, ManagerDashboard, EmployeeDashboard, CustomerDashboard
)

class DashboardService:
    def __init__(self, db: Session, current_user: User):
        self.db = db
        self.user = current_user
    
    def _get_date_range(self, period: str) -> Tuple[date, date]:
        end = date.today()
        days_map = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
        start = end - timedelta(days=days_map.get(period, 30))
        return start, end
    
    def get_sales_overview(self, start: date, end: date, customer_id: str = None) -> SalesMetric:
        # Current period
        query = self.db.query(
            func.count(func.distinct(Order.order_id)),
            func.coalesce(func.sum(OrderDetail.unit_price * OrderDetail.quantity * (1 - OrderDetail.discount)), 0)
        ).select_from(Order).join(OrderDetail).filter(
            Order.order_date >= start,
            Order.order_date <= end,
            Order.deleted_at.is_(None)
        )
        
        if customer_id:
            query = query.filter(Order.customer_id == customer_id)
        
        current = query.first()
        
        # Previous period for comparison
        period_days = (end - start).days
        prev_start = start - timedelta(days=period_days)
        prev_end = start - timedelta(days=1)
        
        prev_query = self.db.query(
            func.count(func.distinct(Order.order_id))
        ).filter(
            Order.order_date >= prev_start,
            Order.order_date <= prev_end,
            Order.deleted_at.is_(None)
        )
        
        if customer_id:
            prev_query = prev_query.filter(Order.customer_id == customer_id)
        
        previous = prev_query.scalar() or 0
        
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
        # Handle different date formatting based on dialect
        if self.db.bind.dialect.name == "postgresql":
            period_func = func.to_char(Order.order_date, 'YYYY-MM')
        else:
            period_func = func.strftime('%Y-%m', Order.order_date)

        results = self.db.query(
            period_func.label('period'),
            func.coalesce(func.sum(OrderDetail.unit_price * OrderDetail.quantity * (1 - OrderDetail.discount)), 0).label('revenue'),
            func.count(func.distinct(Order.order_id)).label('orders')
        ).select_from(Order).join(OrderDetail).filter(
            Order.order_date >= start,
            Order.order_date <= end,
            Order.deleted_at.is_(None)
        ).group_by(period_func).order_by(period_func).all()
        
        return [RevenueByPeriod(period=r.period, revenue=Decimal(str(r.revenue)), orders=r.orders) for r in results]
    
    def get_orders_by_status(self, customer_id: str = None) -> List[OrdersByStatus]:
        query = self.db.query(
            Order.status,
            func.count(Order.order_id)
        ).filter(Order.deleted_at.is_(None))
        
        if customer_id:
            query = query.filter(Order.customer_id == customer_id)
        
        results = query.group_by(Order.status).all()
        
        return [OrdersByStatus(status=r[0].value, count=r[1]) for r in results]
    
    def get_top_products(self, limit: int = 10, customer_id: str = None) -> List[TopProduct]:
        query = self.db.query(
            Product.product_id,
            Product.product_name,
            func.sum(OrderDetail.quantity).label('total_qty'),
            func.sum(OrderDetail.unit_price * OrderDetail.quantity * (1 - OrderDetail.discount)).label('revenue')
        ).select_from(Product).join(OrderDetail).join(Order).filter(
            Order.deleted_at.is_(None)
        )
        
        if customer_id:
            query = query.filter(Order.customer_id == customer_id)
        
        results = query.group_by(Product.product_id, Product.product_name
        ).order_by(func.sum(OrderDetail.quantity).desc()
        ).limit(limit).all()
        
        return [TopProduct(
            product_id=r.product_id,
            product_name=r.product_name,
            total_quantity=r.total_qty,
            total_revenue=Decimal(str(r.revenue))
        ) for r in results]
    
    def get_top_customers(self, limit: int = 10) -> List[TopCustomer]:
        results = self.db.query(
            Customer.customer_id,
            Customer.company_name,
            func.count(func.distinct(Order.order_id)).label('total_orders'),
            func.coalesce(func.sum(OrderDetail.unit_price * OrderDetail.quantity * (1 - OrderDetail.discount)), 0).label('total_spent')
        ).select_from(Customer).join(Order).join(OrderDetail).filter(
            Order.deleted_at.is_(None)
        ).group_by(Customer.customer_id, Customer.company_name
        ).order_by(func.sum(OrderDetail.unit_price * OrderDetail.quantity * (1 - OrderDetail.discount)).desc()
        ).limit(limit).all()
        
        return [TopCustomer(
            customer_id=r.customer_id,
            company_name=r.company_name,
            total_orders=r.total_orders,
            total_spent=Decimal(str(r.total_spent))
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
    
    def get_user_stats(self) -> UserStats:
        total = self.db.query(func.count(User.user_id)).scalar() or 0
        active = self.db.query(func.count(User.user_id)).filter(User.is_active == True).scalar() or 0
        
        by_role = self.db.query(
            User.role,
            func.count(User.user_id)
        ).group_by(User.role).all()
        
        return UserStats(
            total_users=total,
            users_by_role={r[0].value: r[1] for r in by_role},
            active_users=active,
            inactive_users=total - active
        )
    
    def get_recent_orders(self, limit: int = 10, customer_id: str = None):
        query = self.db.query(Order).filter(Order.deleted_at.is_(None))
        
        if customer_id:
            query = query.filter(Order.customer_id == customer_id)
        
        orders = query.order_by(Order.order_date.desc()).limit(limit).all()
        
        return [
            {
                "order_id": o.order_id,
                "order_date": o.order_date.isoformat() if o.order_date else None,
                "status": o.status.value,
                "total": float(o.total)
            }
            for o in orders
        ]
    
    def get_admin_dashboard(self, period: str = "30d") -> AdminDashboard:
        start, end = self._get_date_range(period)
        
        return AdminDashboard(
            user_stats=self.get_user_stats(),
            sales_overview=self.get_sales_overview(start, end),
            revenue_trend=self.get_revenue_trend(start, end),
            orders_by_status=self.get_orders_by_status(),
            top_products=self.get_top_products(10),
            top_customers=self.get_top_customers(10),
            low_stock_alerts=self.get_low_stock_products(10)
        )
    
    def get_manager_dashboard(self, period: str = "30d") -> ManagerDashboard:
        start, end = self._get_date_range(period)
        
        return ManagerDashboard(
            sales_overview=self.get_sales_overview(start, end),
            revenue_trend=self.get_revenue_trend(start, end),
            orders_by_status=self.get_orders_by_status(),
            top_products=self.get_top_products(10),
            top_customers=self.get_top_customers(10),
            low_stock_alerts=self.get_low_stock_products(10),
            recent_orders=self.get_recent_orders(10)
        )
    
    def get_employee_dashboard(self) -> EmployeeDashboard:
        total_products = self.db.query(func.count(Product.product_id)).filter(
            Product.deleted_at.is_(None)
        ).scalar() or 0
        
        total_categories = self.db.query(func.count(Category.category_id)).filter(
            Category.deleted_at.is_(None)
        ).scalar() or 0
        
        total_suppliers = self.db.query(func.count(Supplier.supplier_id)).filter(
            Supplier.deleted_at.is_(None)
        ).scalar() or 0
        
        products = self.db.query(Product).filter(
            Product.deleted_at.is_(None)
        ).order_by(Product.product_name).limit(20).all()
        
        return EmployeeDashboard(
            total_products=total_products,
            total_categories=total_categories,
            total_suppliers=total_suppliers,
            recent_orders=self.get_recent_orders(10),
            product_inventory=[
                {
                    "product_id": p.product_id,
                    "product_name": p.product_name,
                    "units_in_stock": p.units_in_stock,
                    "stock_status": p.stock_status
                }
                for p in products
            ]
        )
    
    def get_customer_dashboard(self, period: str = "30d") -> CustomerDashboard:
        # Find customer record
        customer = self.db.query(Customer).filter(
            Customer.user_id == self.user.user_id
        ).first()
        
        if not customer:
            # Return empty dashboard if no customer record
            return CustomerDashboard(
                my_stats=SalesMetric(
                    total_orders=0,
                    total_revenue=Decimal(0),
                    average_order_value=Decimal(0),
                    orders_change_percent=0
                ),
                order_status_breakdown=[],
                recent_orders=[],
                favorite_products=[]
            )
        
        start, end = self._get_date_range(period)
        
        return CustomerDashboard(
            my_stats=self.get_sales_overview(start, end, customer.customer_id),
            order_status_breakdown=self.get_orders_by_status(customer.customer_id),
            recent_orders=self.get_recent_orders(10, customer.customer_id),
            favorite_products=self.get_top_products(5, customer.customer_id)
        )
