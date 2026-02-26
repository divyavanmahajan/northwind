"""Unit tests for OrderService."""
import pytest
from datetime import date, datetime, timezone
from app.services.order_service import OrderService
from app.schemas.order import OrderCreate, OrderUpdate, OrderDetailCreate, OrderStatus
from app.utils.exceptions import NotFoundError, ValidationError
from app.models.order import Order, OrderStatus as OrderStatusModel
from app.models.order_detail import OrderDetail


def _make_order(db_session, customer_id, product_id, quantity=1):
    """Helper to create an order via OrderCreate."""
    service = OrderService(db_session)
    return service.create(OrderCreate(
        customer_id=customer_id,
        order_details=[OrderDetailCreate(product_id=product_id, quantity=quantity)]
    ))


class TestOrderServiceGetList:
    def test_get_list_empty(self, db_session):
        service = OrderService(db_session)
        orders, total = service.get_list()
        assert isinstance(orders, list)
        assert total == 0

    def test_get_list_returns_created_orders(self, db_session, test_customer, sample_product):
        _make_order(db_session, test_customer.customer_id, sample_product.product_id)
        service = OrderService(db_session)
        orders, total = service.get_list()
        assert total == 1
        assert len(orders) == 1

    def test_get_list_filter_by_status(self, db_session, test_customer, sample_product):
        order = _make_order(db_session, test_customer.customer_id, sample_product.product_id)
        service = OrderService(db_session)

        orders, total = service.get_list(status=OrderStatusModel.PENDING)
        assert total == 1

        orders, total = service.get_list(status=OrderStatusModel.SHIPPED)
        assert total == 0

    def test_get_list_filter_by_customer(self, db_session, test_customer, sample_product):
        _make_order(db_session, test_customer.customer_id, sample_product.product_id)
        service = OrderService(db_session)

        orders, total = service.get_list(customer_id=test_customer.customer_id)
        assert total == 1

        orders, total = service.get_list(customer_id="XXXXX")
        assert total == 0

    def test_get_list_filter_by_product(self, db_session, test_customer, sample_product):
        _make_order(db_session, test_customer.customer_id, sample_product.product_id)
        service = OrderService(db_session)

        orders, total = service.get_list(product_id=sample_product.product_id)
        assert total == 1

        orders, total = service.get_list(product_id=99999)
        assert total == 0

    def test_get_list_sort_asc(self, db_session, test_customer, sample_product):
        _make_order(db_session, test_customer.customer_id, sample_product.product_id)
        _make_order(db_session, test_customer.customer_id, sample_product.product_id)
        service = OrderService(db_session)
        orders, total = service.get_list(sort_by="order_id", sort_order="asc")
        assert total == 2
        assert orders[0].order_id < orders[1].order_id

    def test_get_list_pagination(self, db_session, test_customer, sample_product):
        for _ in range(5):
            _make_order(db_session, test_customer.customer_id, sample_product.product_id)
        service = OrderService(db_session)

        _, total = service.get_list()
        assert total == 5

        page1, _ = service.get_list(page=1, page_size=2)
        page2, _ = service.get_list(page=2, page_size=2)
        assert len(page1) == 2
        assert len(page2) == 2


class TestOrderServiceGetById:
    def test_get_by_id_found(self, db_session, test_customer, sample_product):
        order = _make_order(db_session, test_customer.customer_id, sample_product.product_id)
        service = OrderService(db_session)
        result = service.get_by_id(order.order_id)
        assert result is not None
        assert result.order_id == order.order_id

    def test_get_by_id_not_found(self, db_session):
        service = OrderService(db_session)
        result = service.get_by_id(999999)
        assert result is None

    def test_get_by_id_deleted_returns_none(self, db_session, test_customer, sample_product):
        order = _make_order(db_session, test_customer.customer_id, sample_product.product_id)
        service = OrderService(db_session)
        service.delete(order.order_id)
        result = service.get_by_id(order.order_id)
        assert result is None


class TestOrderServiceCreate:
    def test_create_basic_order(self, db_session, test_customer, sample_product):
        service = OrderService(db_session)
        order = service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            order_details=[OrderDetailCreate(product_id=sample_product.product_id, quantity=3)]
        ))
        assert order.order_id is not None
        assert order.customer_id == test_customer.customer_id
        assert order.status == OrderStatusModel.PENDING
        assert len(order.order_details) == 1
        assert order.order_details[0].quantity == 3

    def test_create_uses_product_price_when_not_specified(self, db_session, test_customer, sample_product):
        service = OrderService(db_session)
        order = service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            order_details=[OrderDetailCreate(product_id=sample_product.product_id, quantity=1)]
        ))
        assert float(order.order_details[0].unit_price) == float(sample_product.unit_price)

    def test_create_with_explicit_price(self, db_session, test_customer, sample_product):
        service = OrderService(db_session)
        order = service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            order_details=[OrderDetailCreate(
                product_id=sample_product.product_id,
                quantity=2,
                unit_price=99.99
            )]
        ))
        assert float(order.order_details[0].unit_price) == 99.99

    def test_create_customer_not_found(self, db_session, sample_product):
        service = OrderService(db_session)
        with pytest.raises(NotFoundError):
            service.create(OrderCreate(
                customer_id="XXXXX",
                order_details=[OrderDetailCreate(product_id=sample_product.product_id, quantity=1)]
            ))

    def test_create_product_not_found(self, db_session, test_customer):
        service = OrderService(db_session)
        with pytest.raises(NotFoundError):
            service.create(OrderCreate(
                customer_id=test_customer.customer_id,
                order_details=[OrderDetailCreate(product_id=999999, quantity=1)]
            ))

    def test_create_with_employee(self, db_session, test_customer, sample_product, test_employee):
        service = OrderService(db_session)
        order = service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            employee_id=test_employee.employee_id,
            order_details=[OrderDetailCreate(product_id=sample_product.product_id, quantity=1)]
        ))
        assert order.employee_id == test_employee.employee_id

    def test_create_sets_order_date_today(self, db_session, test_customer, sample_product):
        service = OrderService(db_session)
        order = service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            order_details=[OrderDetailCreate(product_id=sample_product.product_id, quantity=1)]
        ))
        assert order.order_date == date.today()

    def test_create_multiple_items(self, db_session, test_customer, sample_product, sample_category, sample_supplier):
        from app.models.product import Product
        product2 = Product(
            product_name="Second Product",
            category_id=sample_category.category_id,
            supplier_id=sample_supplier.supplier_id,
            unit_price=5.0,
            units_in_stock=50
        )
        db_session.add(product2)
        db_session.commit()
        db_session.refresh(product2)

        service = OrderService(db_session)
        order = service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            order_details=[
                OrderDetailCreate(product_id=sample_product.product_id, quantity=2),
                OrderDetailCreate(product_id=product2.product_id, quantity=3),
            ]
        ))
        assert len(order.order_details) == 2


class TestOrderServiceUpdate:
    def test_update_shipping_info(self, db_session, test_customer, sample_product):
        order = _make_order(db_session, test_customer.customer_id, sample_product.product_id)
        service = OrderService(db_session)
        updated = service.update(order.order_id, OrderUpdate(ship_city="Berlin"))
        assert updated.ship_city == "Berlin"

    def test_update_not_found(self, db_session):
        service = OrderService(db_session)
        with pytest.raises(NotFoundError):
            service.update(999999, OrderUpdate(ship_city="Berlin"))

    def test_update_invalid_customer(self, db_session, test_customer, sample_product):
        order = _make_order(db_session, test_customer.customer_id, sample_product.product_id)
        service = OrderService(db_session)
        with pytest.raises(NotFoundError):
            service.update(order.order_id, OrderUpdate(customer_id="XXXXX"))


class TestOrderServiceDelete:
    def test_delete_soft_deletes(self, db_session, test_customer, sample_product):
        order = _make_order(db_session, test_customer.customer_id, sample_product.product_id)
        service = OrderService(db_session)
        result = service.delete(order.order_id)
        assert result is True

        # Verify soft deleted
        raw = db_session.query(Order).filter(Order.order_id == order.order_id).first()
        assert raw.deleted_at is not None

    def test_delete_not_found(self, db_session):
        service = OrderService(db_session)
        with pytest.raises(NotFoundError):
            service.delete(999999)


class TestOrderServiceStatusTransitions:
    def _create_order(self, db_session, test_customer, sample_product):
        return _make_order(db_session, test_customer.customer_id, sample_product.product_id)

    def test_pending_to_processing(self, db_session, test_customer, sample_product):
        order = self._create_order(db_session, test_customer, sample_product)
        service = OrderService(db_session)
        updated = service.update_status(order.order_id, OrderStatusModel.PROCESSING)
        assert updated.status == OrderStatusModel.PROCESSING

    def test_pending_to_cancelled(self, db_session, test_customer, sample_product):
        order = self._create_order(db_session, test_customer, sample_product)
        service = OrderService(db_session)
        updated = service.update_status(order.order_id, OrderStatusModel.CANCELLED)
        assert updated.status == OrderStatusModel.CANCELLED

    def test_processing_to_shipped_sets_date(self, db_session, test_customer, sample_product):
        order = self._create_order(db_session, test_customer, sample_product)
        service = OrderService(db_session)
        service.update_status(order.order_id, OrderStatusModel.PROCESSING)
        updated = service.update_status(order.order_id, OrderStatusModel.SHIPPED)
        assert updated.status == OrderStatusModel.SHIPPED
        assert updated.shipped_date == date.today()

    def test_shipped_to_delivered(self, db_session, test_customer, sample_product):
        order = self._create_order(db_session, test_customer, sample_product)
        service = OrderService(db_session)
        service.update_status(order.order_id, OrderStatusModel.PROCESSING)
        service.update_status(order.order_id, OrderStatusModel.SHIPPED)
        updated = service.update_status(order.order_id, OrderStatusModel.DELIVERED)
        assert updated.status == OrderStatusModel.DELIVERED

    def test_invalid_transition_raises_validation_error(self, db_session, test_customer, sample_product):
        order = self._create_order(db_session, test_customer, sample_product)
        service = OrderService(db_session)
        # PENDING -> DELIVERED is not allowed
        with pytest.raises(ValidationError) as exc_info:
            service.update_status(order.order_id, OrderStatusModel.DELIVERED)
        assert "Cannot transition" in str(exc_info.value)

    def test_delivered_to_pending_invalid(self, db_session, test_customer, sample_product):
        order = self._create_order(db_session, test_customer, sample_product)
        service = OrderService(db_session)
        service.update_status(order.order_id, OrderStatusModel.PROCESSING)
        service.update_status(order.order_id, OrderStatusModel.SHIPPED)
        service.update_status(order.order_id, OrderStatusModel.DELIVERED)
        with pytest.raises(ValidationError):
            service.update_status(order.order_id, OrderStatusModel.PENDING)

    def test_cancelled_to_processing_invalid(self, db_session, test_customer, sample_product):
        order = self._create_order(db_session, test_customer, sample_product)
        service = OrderService(db_session)
        service.update_status(order.order_id, OrderStatusModel.CANCELLED)
        with pytest.raises(ValidationError):
            service.update_status(order.order_id, OrderStatusModel.PROCESSING)

    def test_status_update_same_status_is_noop(self, db_session, test_customer, sample_product):
        order = self._create_order(db_session, test_customer, sample_product)
        service = OrderService(db_session)
        # Setting same status should not raise
        updated = service.update_status(order.order_id, OrderStatusModel.PENDING)
        assert updated.status == OrderStatusModel.PENDING

    def test_update_status_not_found(self, db_session):
        service = OrderService(db_session)
        with pytest.raises(NotFoundError):
            service.update_status(999999, OrderStatusModel.PROCESSING)


class TestOrderServiceAccessFilter:
    def test_customer_role_no_link_sees_nothing(self, db_session, test_customer_user, test_customer, sample_product):
        _make_order(db_session, test_customer.customer_id, sample_product.product_id)
        service = OrderService(db_session, current_user=test_customer_user)
        orders, total = service.get_list()
        assert total == 0

    def test_customer_role_with_link_sees_own_orders(self, db_session, test_customer_user, test_customer, sample_product):
        test_customer.user_id = test_customer_user.user_id
        db_session.commit()
        _make_order(db_session, test_customer.customer_id, sample_product.product_id)
        service = OrderService(db_session, current_user=test_customer_user)
        orders, total = service.get_list()
        assert total == 1

    def test_admin_sees_all_orders(self, db_session, admin_user, test_customer, sample_product):
        _make_order(db_session, test_customer.customer_id, sample_product.product_id)
        service = OrderService(db_session, current_user=admin_user)
        orders, total = service.get_list()
        assert total == 1
