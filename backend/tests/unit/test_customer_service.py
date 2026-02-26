"""Unit tests for CustomerService."""
import pytest
from datetime import date
from app.services.customer_service import CustomerService
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.utils.exceptions import NotFoundError, ConflictError
from app.models.customer import Customer
from app.models.user import UserRole


def _make_customer(db_session, customer_id="CUST1", company_name="Test Co"):
    c = Customer(customer_id=customer_id, company_name=company_name,
                 contact_name="Test User", city="Berlin", country="Germany")
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


class TestCustomerServiceGetById:
    def test_get_by_id_found(self, db_session, test_customer):
        service = CustomerService(db_session)
        result = service.get_by_id(test_customer.customer_id)
        assert result is not None
        assert result.customer_id == test_customer.customer_id

    def test_get_by_id_not_found(self, db_session):
        service = CustomerService(db_session)
        result = service.get_by_id("XXXXX")
        assert result is None

    def test_get_by_id_deleted_returns_none(self, db_session, test_customer):
        service = CustomerService(db_session)
        service.delete(test_customer.customer_id)
        result = service.get_by_id(test_customer.customer_id)
        assert result is None


class TestCustomerServiceGetList:
    def test_get_list_basic(self, db_session, test_customer):
        service = CustomerService(db_session)
        items, total = service.get_list()
        assert total >= 1
        ids = [c.customer_id for c in items]
        assert test_customer.customer_id in ids

    def test_get_list_search_by_company(self, db_session, test_customer):
        service = CustomerService(db_session)
        items, total = service.get_list(search=test_customer.company_name[:5])
        assert total >= 1

    def test_get_list_search_no_match(self, db_session, test_customer):
        service = CustomerService(db_session)
        items, total = service.get_list(search="xyzxyz_no_match")
        assert total == 0

    def test_get_list_filter_by_country(self, db_session, test_customer):
        service = CustomerService(db_session)
        items, total = service.get_list(country=test_customer.country)
        assert total >= 1
        for c in items:
            assert c.country == test_customer.country

    def test_get_list_filter_by_city(self, db_session, test_customer):
        service = CustomerService(db_session)
        items, total = service.get_list(city=test_customer.city)
        assert total >= 1

    def test_get_list_pagination(self, db_session):
        for i in range(5):
            _make_customer(db_session, f"PAG{i:02d}", f"Paging Co {i}")
        service = CustomerService(db_session)
        _, total = service.get_list()
        assert total >= 5
        page1, _ = service.get_list(page=1, page_size=2)
        assert len(page1) == 2

    def test_get_list_sort_desc(self, db_session):
        _make_customer(db_session, "AAA00", "AAA Company")
        _make_customer(db_session, "ZZZ00", "ZZZ Company")
        service = CustomerService(db_session)
        items, _ = service.get_list(sort_by="company_name", sort_order="desc")
        names = [c.company_name for c in items]
        assert names == sorted(names, reverse=True)


class TestCustomerServiceCreate:
    def test_create_success(self, db_session):
        service = CustomerService(db_session)
        customer = service.create(CustomerCreate(
            customer_id="NEWCU",
            company_name="New Customer Ltd",
            contact_name="Jane Doe",
            city="Paris",
            country="France"
        ))
        assert customer.customer_id == "NEWCU"
        assert customer.company_name == "New Customer Ltd"

    def test_create_duplicate_id_raises_conflict(self, db_session, test_customer):
        service = CustomerService(db_session)
        with pytest.raises(ConflictError):
            service.create(CustomerCreate(
                customer_id=test_customer.customer_id,
                company_name="Duplicate"
            ))

    def test_create_with_linked_user(self, db_session, test_customer_user):
        service = CustomerService(db_session)
        customer = service.create(CustomerCreate(
            customer_id="USRCU",
            company_name="User Customer",
            user_id=test_customer_user.user_id
        ))
        assert customer.user_id == test_customer_user.user_id

    def test_create_user_already_linked_raises_conflict(self, db_session, test_customer_user, test_customer):
        # Link user to test_customer
        test_customer.user_id = test_customer_user.user_id
        db_session.commit()

        service = CustomerService(db_session)
        with pytest.raises(ConflictError):
            service.create(CustomerCreate(
                customer_id="NEWC2",
                company_name="Another Company",
                user_id=test_customer_user.user_id
            ))


class TestCustomerServiceUpdate:
    def test_update_company_name(self, db_session, test_customer):
        service = CustomerService(db_session)
        updated = service.update(test_customer.customer_id, CustomerUpdate(company_name="Updated Name"))
        assert updated.company_name == "Updated Name"
        assert updated.contact_name == test_customer.contact_name  # unchanged

    def test_update_not_found(self, db_session):
        service = CustomerService(db_session)
        with pytest.raises(NotFoundError):
            service.update("XXXXX", CustomerUpdate(company_name="Doesn't Matter"))

    def test_update_user_id_conflict(self, db_session, test_customer_user, test_customer):
        # Create a second customer already linked to our user
        other = _make_customer(db_session, "OTHRC", "Other Corp")
        other.user_id = test_customer_user.user_id
        db_session.commit()

        service = CustomerService(db_session)
        with pytest.raises(ConflictError):
            service.update(test_customer.customer_id, CustomerUpdate(user_id=test_customer_user.user_id))

    def test_update_city_and_country(self, db_session, test_customer):
        service = CustomerService(db_session)
        updated = service.update(test_customer.customer_id, CustomerUpdate(city="Tokyo", country="Japan"))
        assert updated.city == "Tokyo"
        assert updated.country == "Japan"


class TestCustomerServiceDelete:
    def test_delete_soft_deletes(self, db_session, test_customer):
        service = CustomerService(db_session)
        result = service.delete(test_customer.customer_id)
        assert result is True
        raw = db_session.query(Customer).filter(Customer.customer_id == test_customer.customer_id).first()
        assert raw.deleted_at is not None

    def test_delete_not_found(self, db_session):
        service = CustomerService(db_session)
        with pytest.raises(NotFoundError):
            service.delete("XXXXX")


class TestCustomerServiceFilters:
    def test_get_countries(self, db_session, test_customer):
        service = CustomerService(db_session)
        countries = service.get_countries()
        assert test_customer.country in countries

    def test_get_countries_excludes_deleted(self, db_session, test_customer):
        service = CustomerService(db_session)
        service.delete(test_customer.customer_id)
        countries = service.get_countries()
        assert test_customer.country not in countries

    def test_get_cities(self, db_session, test_customer):
        service = CustomerService(db_session)
        cities = service.get_cities()
        assert test_customer.city in cities

    def test_get_cities_filtered_by_country(self, db_session, test_customer):
        service = CustomerService(db_session)
        cities = service.get_cities(country=test_customer.country)
        assert test_customer.city in cities

    def test_get_cities_wrong_country_returns_empty(self, db_session, test_customer):
        service = CustomerService(db_session)
        cities = service.get_cities(country="NonExistentCountry")
        assert len(cities) == 0


class TestCustomerServiceStatistics:
    def test_get_statistics_no_orders(self, db_session, test_customer):
        service = CustomerService(db_session)
        stats = service.get_statistics(test_customer.customer_id)
        assert stats.total_orders == 0
        assert float(stats.total_spent) == 0
        assert stats.first_order_date is None
        assert stats.last_order_date is None

    def test_get_statistics_with_orders(self, db_session, test_customer, sample_product):
        from app.services.order_service import OrderService
        from app.schemas.order import OrderCreate, OrderDetailCreate
        order_service = OrderService(db_session)
        order_service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            order_details=[OrderDetailCreate(product_id=sample_product.product_id, quantity=2, unit_price=10.0)]
        ))

        service = CustomerService(db_session)
        stats = service.get_statistics(test_customer.customer_id)
        assert stats.total_orders == 1
        assert float(stats.total_spent) == 20.0
        assert stats.first_order_date is not None
        assert stats.last_order_date is not None


class TestCustomerServiceCurrentUser:
    def test_get_for_current_user_returns_linked_customer(self, db_session, test_customer_user, test_customer):
        test_customer.user_id = test_customer_user.user_id
        db_session.commit()

        service = CustomerService(db_session, current_user=test_customer_user)
        result = service.get_for_current_user()
        assert result is not None
        assert result.customer_id == test_customer.customer_id

    def test_get_for_current_user_no_link_returns_none(self, db_session, test_customer_user):
        service = CustomerService(db_session, current_user=test_customer_user)
        result = service.get_for_current_user()
        assert result is None

    def test_get_for_no_user_returns_none(self, db_session):
        service = CustomerService(db_session, current_user=None)
        result = service.get_for_current_user()
        assert result is None


class TestCustomerServiceAccessFilter:
    def test_customer_role_no_link_gets_nothing(self, db_session, test_customer_user, test_customer):
        service = CustomerService(db_session, current_user=test_customer_user)
        items, total = service.get_list()
        assert total == 0

    def test_customer_role_with_link_gets_own_only(self, db_session, test_customer_user, test_customer):
        test_customer.user_id = test_customer_user.user_id
        db_session.commit()
        _make_customer(db_session, "OTHER", "Other Corp")

        service = CustomerService(db_session, current_user=test_customer_user)
        items, total = service.get_list()
        assert total == 1
        assert items[0].customer_id == test_customer.customer_id

    def test_customer_role_cannot_access_other_customer(self, db_session, test_customer_user, test_customer):
        test_customer.user_id = test_customer_user.user_id
        db_session.commit()
        other = _make_customer(db_session, "OOOOO", "Other Corp")

        service = CustomerService(db_session, current_user=test_customer_user)
        result = service.get_by_id(other.customer_id)
        assert result is None
