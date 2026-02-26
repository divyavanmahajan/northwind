"""Unit tests for EmployeeService."""
import pytest
from datetime import date
from app.services.employee_service import EmployeeService
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.utils.exceptions import NotFoundError, ConflictError
from app.models.employee import Employee


def _make_employee(db_session, first="John", last="Smith", title="Developer"):
    emp = Employee(first_name=first, last_name=last, title=title,
                   birth_date=date(1980, 1, 1), hire_date=date(2010, 1, 1))
    db_session.add(emp)
    db_session.commit()
    db_session.refresh(emp)
    return emp


class TestEmployeeServiceGetById:
    def test_get_by_id_found(self, db_session, test_employee):
        service = EmployeeService(db_session)
        result = service.get_by_id(test_employee.employee_id)
        assert result is not None
        assert result.employee_id == test_employee.employee_id

    def test_get_by_id_not_found(self, db_session):
        service = EmployeeService(db_session)
        result = service.get_by_id(999999)
        assert result is None

    def test_get_by_id_deleted_returns_none(self, db_session, test_employee):
        service = EmployeeService(db_session)
        service.delete(test_employee.employee_id)
        result = service.get_by_id(test_employee.employee_id)
        assert result is None


class TestEmployeeServiceGetList:
    def test_get_list_basic(self, db_session, test_employee):
        service = EmployeeService(db_session)
        employees, total = service.get_list()
        assert total >= 1

    def test_get_list_search(self, db_session, test_employee):
        service = EmployeeService(db_session)
        employees, total = service.get_list(search=test_employee.last_name)
        assert total >= 1

    def test_get_list_search_no_match(self, db_session, test_employee):
        service = EmployeeService(db_session)
        employees, total = service.get_list(search="xyzxyzxyz_nope")
        assert total == 0

    def test_get_list_filter_by_title(self, db_session, test_employee):
        service = EmployeeService(db_session)
        employees, total = service.get_list(title=test_employee.title)
        assert total >= 1
        for e in employees:
            assert e.title == test_employee.title

    def test_get_list_filter_by_city(self, db_session):
        emp = _make_employee(db_session, "Alice", "Jones", "Engineer")
        emp.city = "London"
        db_session.commit()
        service = EmployeeService(db_session)
        employees, total = service.get_list(city="London")
        assert total >= 1

    def test_get_list_filter_by_country(self, db_session):
        emp = _make_employee(db_session, "Bob", "Williams", "Manager")
        emp.country = "UK"
        db_session.commit()
        service = EmployeeService(db_session)
        employees, total = service.get_list(country="UK")
        assert total >= 1

    def test_get_list_sort_desc(self, db_session, test_employee):
        _make_employee(db_session, "Zelda", "ZZZZZ", "VP")
        service = EmployeeService(db_session)
        employees, _ = service.get_list(sort_by="last_name", sort_order="desc")
        last_names = [e.last_name for e in employees]
        assert last_names == sorted(last_names, reverse=True)

    def test_get_list_pagination(self, db_session):
        for i in range(5):
            _make_employee(db_session, f"Person{i}", f"Surname{i}")
        service = EmployeeService(db_session)
        _, total = service.get_list()
        assert total >= 5
        page1, _ = service.get_list(page=1, page_size=2)
        assert len(page1) == 2


class TestEmployeeServiceGetTitles:
    def test_get_titles(self, db_session, test_employee):
        service = EmployeeService(db_session)
        titles = service.get_titles()
        assert test_employee.title in titles

    def test_get_titles_unique(self, db_session):
        _make_employee(db_session, "A", "A", "Analyst")
        _make_employee(db_session, "B", "B", "Analyst")
        service = EmployeeService(db_session)
        titles = service.get_titles()
        assert len(titles) == len(set(titles))


class TestEmployeeServiceCreate:
    def test_create_basic(self, db_session):
        service = EmployeeService(db_session)
        employee = service.create(EmployeeCreate(
            first_name="Alice",
            last_name="Wonderland",
            title="Developer",
            birth_date=date(1990, 5, 15),
            hire_date=date(2020, 1, 1)
        ))
        assert employee.employee_id is not None
        assert employee.first_name == "Alice"

    def test_create_with_valid_manager(self, db_session, test_employee):
        service = EmployeeService(db_session)
        employee = service.create(EmployeeCreate(
            first_name="Bob",
            last_name="Builder",
            title="Junior Dev",
            birth_date=date(1995, 3, 10),
            hire_date=date(2022, 6, 1),
            reports_to=test_employee.employee_id
        ))
        assert employee.reports_to == test_employee.employee_id

    def test_create_with_invalid_manager_raises_not_found(self, db_session):
        service = EmployeeService(db_session)
        with pytest.raises(NotFoundError):
            service.create(EmployeeCreate(
                first_name="Test",
                last_name="Person",
                title="Analyst",
                birth_date=date(1990, 1, 1),
                hire_date=date(2020, 1, 1),
                reports_to=999999
            ))


class TestEmployeeServiceUpdate:
    def test_update_title(self, db_session, test_employee):
        service = EmployeeService(db_session)
        updated = service.update(test_employee.employee_id, EmployeeUpdate(title="Senior Manager"))
        assert updated.title == "Senior Manager"

    def test_update_not_found(self, db_session):
        service = EmployeeService(db_session)
        with pytest.raises(NotFoundError):
            service.update(999999, EmployeeUpdate(title="VP"))

    def test_update_reports_to_self_raises_conflict(self, db_session, test_employee):
        service = EmployeeService(db_session)
        with pytest.raises(ConflictError):
            service.update(test_employee.employee_id,
                           EmployeeUpdate(reports_to=test_employee.employee_id))

    def test_update_reports_to_invalid_manager(self, db_session, test_employee):
        service = EmployeeService(db_session)
        with pytest.raises(NotFoundError):
            service.update(test_employee.employee_id, EmployeeUpdate(reports_to=999999))

    def test_update_reports_to_valid_manager(self, db_session, test_employee):
        manager = _make_employee(db_session, "Boss", "Person", "Director")
        service = EmployeeService(db_session)
        updated = service.update(test_employee.employee_id, EmployeeUpdate(reports_to=manager.employee_id))
        assert updated.reports_to == manager.employee_id


class TestEmployeeServiceDelete:
    def test_delete_soft_deletes(self, db_session, test_employee):
        service = EmployeeService(db_session)
        result = service.delete(test_employee.employee_id)
        assert result is True
        raw = db_session.query(Employee).filter(Employee.employee_id == test_employee.employee_id).first()
        assert raw.deleted_at is not None

    def test_delete_not_found(self, db_session):
        service = EmployeeService(db_session)
        with pytest.raises(NotFoundError):
            service.delete(999999)

    def test_delete_with_subordinates_raises_conflict(self, db_session, test_employee):
        report = _make_employee(db_session, "Report", "Person", "Analyst")
        report.reports_to = test_employee.employee_id
        db_session.commit()

        service = EmployeeService(db_session)
        with pytest.raises(ConflictError) as exc_info:
            service.delete(test_employee.employee_id)
        assert "direct reports" in str(exc_info.value)


class TestEmployeeServiceAvailableManagers:
    def test_get_available_managers_excludes_self(self, db_session, test_employee):
        service = EmployeeService(db_session)
        managers = service.get_available_managers(exclude_id=test_employee.employee_id)
        ids = [m.employee_id for m in managers]
        assert test_employee.employee_id not in ids

    def test_get_available_managers_includes_others(self, db_session, test_employee):
        other = _make_employee(db_session, "Other", "Manager", "Director")
        service = EmployeeService(db_session)
        managers = service.get_available_managers()
        ids = [m.employee_id for m in managers]
        assert other.employee_id in ids


class TestEmployeeServiceOrgTree:
    def test_get_org_tree_empty(self, db_session):
        service = EmployeeService(db_session)
        tree = service.get_org_tree()
        assert isinstance(tree, list)

    def test_get_org_tree_top_level(self, db_session, test_employee):
        # test_employee has no reports_to, so should be top-level
        service = EmployeeService(db_session)
        tree = service.get_org_tree()
        top_ids = [node["employee_id"] for node in tree]
        assert test_employee.employee_id in top_ids

    def test_get_org_tree_includes_subordinates(self, db_session, test_employee):
        report = _make_employee(db_session, "Sub", "Ordinate", "Analyst")
        report.reports_to = test_employee.employee_id
        db_session.commit()

        service = EmployeeService(db_session)
        tree = service.get_org_tree()

        emp_node = next(n for n in tree if n["employee_id"] == test_employee.employee_id)
        subordinate_ids = [s["employee_id"] for s in emp_node["subordinates"]]
        assert report.employee_id in subordinate_ids


class TestEmployeeServiceStatistics:
    def test_get_statistics_no_orders(self, db_session, test_employee):
        service = EmployeeService(db_session)
        stats = service.get_statistics(test_employee.employee_id)
        assert stats.total_orders == 0
        assert float(stats.total_sales) == 0.0

    def test_get_statistics_with_orders(self, db_session, test_employee, test_customer, sample_product):
        from app.services.order_service import OrderService
        from app.schemas.order import OrderCreate, OrderDetailCreate
        order_service = OrderService(db_session)
        order_service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            employee_id=test_employee.employee_id,
            order_details=[OrderDetailCreate(
                product_id=sample_product.product_id,
                quantity=2,
                unit_price=10.0
            )]
        ))
        stats = service = EmployeeService(db_session)
        result = stats.get_statistics(test_employee.employee_id)
        assert result.total_orders == 1
        assert float(result.total_sales) == 20.0
