"""Unit tests for DashboardService."""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from app.services.dashboard_service import DashboardService
from app.models.user import UserRole
from app.models.customer import Customer
from app.models.product import Product
from app.models.category import Category
from app.models.supplier import Supplier


def _make_admin_service(db_session, admin_user):
    return DashboardService(db_session, admin_user)


def _make_employee_service(db_session, employee_user):
    return DashboardService(db_session, employee_user)


class TestDashboardServiceDateRange:
    def test_get_date_range_all_no_orders(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        start, end = service._get_date_range("all")
        assert start == date.today()
        assert end == date.today()

    def test_get_date_range_30d_no_orders(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        start, end = service._get_date_range("30d")
        assert end == date.today()
        assert start == date.today() - timedelta(days=30)

    def test_get_date_range_7d(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        start, end = service._get_date_range("7d")
        assert (end - start).days == 7

    def test_get_date_range_90d(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        start, end = service._get_date_range("90d")
        assert (end - start).days == 90

    def test_get_date_range_1y(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        start, end = service._get_date_range("1y")
        assert (end - start).days == 365

    def test_get_date_range_unknown_period_defaults_to_30d(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        start, end = service._get_date_range("invalid")
        assert (end - start).days == 30

    def test_get_date_range_all_with_orders(self, db_session, admin_user, test_customer, sample_product):
        from app.services.order_service import OrderService
        from app.schemas.order import OrderCreate, OrderDetailCreate
        order_service = OrderService(db_session)
        order_service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            order_details=[OrderDetailCreate(product_id=sample_product.product_id, quantity=1)]
        ))
        service = _make_admin_service(db_session, admin_user)
        start, end = service._get_date_range("all")
        assert start <= end
        assert start <= date.today()


class TestDashboardServiceUserStats:
    def test_get_user_stats_counts_users(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        stats = service.get_user_stats()
        # At least admin_user exists
        assert stats.total_users >= 1
        assert stats.active_users >= 1

    def test_get_user_stats_by_role(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        stats = service.get_user_stats()
        assert isinstance(stats.users_by_role, dict)
        assert "admin" in stats.users_by_role

    def test_get_user_stats_inactive_count(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        stats = service.get_user_stats()
        assert stats.inactive_users == stats.total_users - stats.active_users


class TestDashboardServiceSalesOverview:
    def test_get_sales_overview_no_data(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        overview = service.get_sales_overview(
            date.today() - timedelta(days=30),
            date.today()
        )
        assert overview.total_orders == 0
        assert float(overview.total_revenue) == 0.0

    def test_get_sales_overview_with_orders(self, db_session, admin_user, test_customer, sample_product):
        from app.services.order_service import OrderService
        from app.schemas.order import OrderCreate, OrderDetailCreate
        order_service = OrderService(db_session)
        order_service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            order_details=[OrderDetailCreate(
                product_id=sample_product.product_id,
                quantity=2,
                unit_price=10.0
            )]
        ))
        service = _make_admin_service(db_session, admin_user)
        overview = service.get_sales_overview(
            date.today() - timedelta(days=1),
            date.today()
        )
        assert overview.total_orders == 1
        assert float(overview.total_revenue) == 20.0
        assert float(overview.average_order_value) == 20.0


class TestDashboardServiceOrdersByStatus:
    def test_get_orders_by_status_empty(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        result = service.get_orders_by_status()
        assert isinstance(result, list)

    def test_get_orders_by_status_with_orders(self, db_session, admin_user, test_customer, sample_product):
        from app.services.order_service import OrderService
        from app.schemas.order import OrderCreate, OrderDetailCreate
        order_service = OrderService(db_session)
        order_service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            order_details=[OrderDetailCreate(product_id=sample_product.product_id, quantity=1)]
        ))
        service = _make_admin_service(db_session, admin_user)
        result = service.get_orders_by_status()
        statuses = [r.status for r in result]
        assert "pending" in statuses


class TestDashboardServiceTopProducts:
    def test_get_top_products_empty(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        result = service.get_top_products()
        assert isinstance(result, list)

    def test_get_top_products_with_orders(self, db_session, admin_user, test_customer, sample_product):
        from app.services.order_service import OrderService
        from app.schemas.order import OrderCreate, OrderDetailCreate
        order_service = OrderService(db_session)
        order_service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            order_details=[OrderDetailCreate(
                product_id=sample_product.product_id,
                quantity=5,
                unit_price=10.0
            )]
        ))
        service = _make_admin_service(db_session, admin_user)
        result = service.get_top_products(limit=5)
        assert len(result) >= 1
        assert result[0].product_id == sample_product.product_id
        assert result[0].quantity_sold == 5


class TestDashboardServiceTopCustomers:
    def test_get_top_customers_empty(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        result = service.get_top_customers()
        assert isinstance(result, list)

    def test_get_top_customers_with_orders(self, db_session, admin_user, test_customer, sample_product):
        from app.services.order_service import OrderService
        from app.schemas.order import OrderCreate, OrderDetailCreate
        order_service = OrderService(db_session)
        order_service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            order_details=[OrderDetailCreate(
                product_id=sample_product.product_id,
                quantity=1,
                unit_price=50.0
            )]
        ))
        service = _make_admin_service(db_session, admin_user)
        result = service.get_top_customers(limit=5)
        assert len(result) >= 1
        customer_ids = [r.customer_id for r in result]
        assert test_customer.customer_id in customer_ids


class TestDashboardServiceLowStockProducts:
    def test_get_low_stock_products_empty(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        result = service.get_low_stock_products()
        assert isinstance(result, list)

    def test_get_low_stock_products_detects_low_stock(self, db_session, admin_user, sample_category, sample_supplier):
        low_product = Product(
            product_name="Low Stock Item",
            category_id=sample_category.category_id,
            supplier_id=sample_supplier.supplier_id,
            unit_price=5.0,
            units_in_stock=2,
            reorder_level=10,  # in_stock < reorder_level
            discontinued=False
        )
        db_session.add(low_product)
        db_session.commit()

        service = _make_admin_service(db_session, admin_user)
        result = service.get_low_stock_products()
        ids = [p.product_id for p in result]
        assert low_product.product_id in ids

    def test_get_low_stock_excludes_discontinued(self, db_session, admin_user, sample_category, sample_supplier):
        disc_product = Product(
            product_name="Discontinued Low",
            category_id=sample_category.category_id,
            supplier_id=sample_supplier.supplier_id,
            unit_price=5.0,
            units_in_stock=1,
            reorder_level=10,
            discontinued=True
        )
        db_session.add(disc_product)
        db_session.commit()

        service = _make_admin_service(db_session, admin_user)
        result = service.get_low_stock_products()
        ids = [p.product_id for p in result]
        assert disc_product.product_id not in ids


class TestDashboardServiceRecentOrders:
    def test_get_recent_orders_empty(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        result = service.get_recent_orders()
        assert isinstance(result, list)

    def test_get_recent_orders_with_data(self, db_session, admin_user, test_customer, sample_product):
        from app.services.order_service import OrderService
        from app.schemas.order import OrderCreate, OrderDetailCreate
        order_service = OrderService(db_session)
        order_service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            order_details=[OrderDetailCreate(product_id=sample_product.product_id, quantity=1)]
        ))
        service = _make_admin_service(db_session, admin_user)
        result = service.get_recent_orders(limit=5)
        assert len(result) == 1
        assert "order_id" in result[0]
        assert "status" in result[0]
        assert "total" in result[0]


class TestDashboardServiceRevenueTrend:
    def test_get_revenue_trend_empty(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        result = service.get_revenue_trend(
            date.today() - timedelta(days=7),
            date.today()
        )
        assert isinstance(result, list)

    def test_get_revenue_trend_with_orders(self, db_session, admin_user, test_customer, sample_product):
        from app.services.order_service import OrderService
        from app.schemas.order import OrderCreate, OrderDetailCreate
        order_service = OrderService(db_session)
        order_service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            order_details=[OrderDetailCreate(
                product_id=sample_product.product_id,
                quantity=1,
                unit_price=100.0
            )]
        ))
        service = _make_admin_service(db_session, admin_user)
        result = service.get_revenue_trend(
            date.today() - timedelta(days=7),
            date.today()
        )
        assert len(result) >= 1
        total_rev = sum(float(r.revenue) for r in result)
        assert total_rev == 100.0


class TestDashboardServiceAdminDashboard:
    def test_get_admin_dashboard_structure(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        dashboard = service.get_admin_dashboard("30d")
        assert dashboard.user_stats is not None
        assert dashboard.sales_overview is not None
        assert dashboard.orders_by_status is not None
        assert isinstance(dashboard.top_products, list)
        assert isinstance(dashboard.top_customers, list)
        assert isinstance(dashboard.low_stock_alerts, list)
        assert isinstance(dashboard.revenue_trend, list)

    def test_get_admin_dashboard_all_period(self, db_session, admin_user):
        service = _make_admin_service(db_session, admin_user)
        dashboard = service.get_admin_dashboard("all")
        assert dashboard.sales_overview is not None


class TestDashboardServiceManagerDashboard:
    def test_get_manager_dashboard_structure(self, db_session, employee_user):
        service = DashboardService(db_session, employee_user)
        dashboard = service.get_manager_dashboard("30d")
        assert dashboard.sales_overview is not None
        assert isinstance(dashboard.recent_orders, list)


class TestDashboardServiceEmployeeDashboard:
    def test_get_employee_dashboard_structure(self, db_session, employee_user):
        service = _make_employee_service(db_session, employee_user)
        dashboard = service.get_employee_dashboard()
        assert "total_products" in dashboard.__dict__ or dashboard.total_products is not None
        assert dashboard.total_products >= 0
        assert dashboard.total_categories >= 0
        assert dashboard.total_suppliers >= 0
        assert isinstance(dashboard.recent_orders, list)
        assert isinstance(dashboard.product_inventory, list)

    def test_get_employee_dashboard_counts_products(self, db_session, employee_user, sample_product):
        service = _make_employee_service(db_session, employee_user)
        dashboard = service.get_employee_dashboard()
        assert dashboard.total_products >= 1


class TestDashboardServiceCustomerDashboard:
    def test_get_customer_dashboard_no_customer_record(self, db_session, test_customer_user):
        service = DashboardService(db_session, test_customer_user)
        dashboard = service.get_customer_dashboard("30d")
        assert dashboard.my_stats is not None
        assert dashboard.my_stats.total_orders == 0
        assert isinstance(dashboard.order_status_breakdown, list)
        assert isinstance(dashboard.recent_orders, list)
        assert isinstance(dashboard.favorite_products, list)

    def test_get_customer_dashboard_with_customer_record(self, db_session, test_customer_user, test_customer, sample_product):
        test_customer.user_id = test_customer_user.user_id
        db_session.commit()

        from app.services.order_service import OrderService
        from app.schemas.order import OrderCreate, OrderDetailCreate
        order_service = OrderService(db_session)
        order_service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            order_details=[OrderDetailCreate(
                product_id=sample_product.product_id,
                quantity=1,
                unit_price=25.0
            )]
        ))

        service = DashboardService(db_session, test_customer_user)
        dashboard = service.get_customer_dashboard("all")
        assert dashboard.my_stats.total_orders == 1
        assert float(dashboard.my_stats.total_revenue) == 25.0
