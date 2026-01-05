# Prompt 28: Backend Coverage & Final Tests

## Context
Ensure comprehensive test coverage for the backend before deployment.

## Prerequisites
- Completed Prompt 27 (E2E Setup)
- All backend features implemented

## Goals
1. Review and increase test coverage
2. Add integration tests for all endpoints
3. Add edge case testing
4. Configure coverage reporting
5. Ensure CI-ready test suite

---

## Prompt

```text
Complete backend test coverage and configure reporting for CI.

PYTEST CONFIGURATION (backend/pytest.ini):
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short --strict-markers
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
filterwarnings =
    ignore::DeprecationWarning
```

COVERAGE CONFIGURATION (backend/.coveragerc):
```ini
[run]
source = app
omit =
    */tests/*
    */migrations/*
    */__pycache__/*

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise NotImplementedError
    if __name__ == .__main__.:

[html]
directory = htmlcov
```

TEST CONFTEST (backend/tests/conftest.py):
```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, get_db
from app.models import *
from app.services.user_service import UserService
from app.schemas.user import UserCreate
from app.models.user import UserRole

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def db_engine():
    """Create test database engine."""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create a new database session for a test."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as c:
        yield c
    
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session):
    """Create an admin user for testing."""
    service = UserService(db_session)
    user = service.create(UserCreate(
        username="testadmin",
        email="testadmin@test.com",
        password="TestAdmin123!",
        role=UserRole.ADMIN
    ))
    return user


@pytest.fixture
def admin_token(client, admin_user):
    """Get auth token for admin user."""
    response = client.post("/api/v1/auth/login", json={
        "username": "testadmin",
        "password": "TestAdmin123!"
    })
    return response.json()["access_token"]


@pytest.fixture
def employee_user(db_session):
    """Create an employee user for testing."""
    service = UserService(db_session)
    return service.create(UserCreate(
        username="testemployee",
        email="testemployee@test.com",
        password="TestEmployee123!",
        role=UserRole.EMPLOYEE
    ))


@pytest.fixture
def employee_token(client, employee_user):
    """Get auth token for employee user."""
    response = client.post("/api/v1/auth/login", json={
        "username": "testemployee",
        "password": "TestEmployee123!"
    })
    return response.json()["access_token"]


@pytest.fixture
def sample_category(db_session):
    """Create a sample category."""
    category = Category(
        category_name="Test Category",
        description="Test Description"
    )
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category


@pytest.fixture
def sample_supplier(db_session):
    """Create a sample supplier."""
    supplier = Supplier(
        company_name="Test Supplier",
        contact_name="Test Contact",
        country="USA",
        city="New York"
    )
    db_session.add(supplier)
    db_session.commit()
    db_session.refresh(supplier)
    return supplier


@pytest.fixture
def sample_product(db_session, sample_category, sample_supplier):
    """Create a sample product."""
    product = Product(
        product_name="Test Product",
        category_id=sample_category.category_id,
        supplier_id=sample_supplier.supplier_id,
        unit_price=10.00,
        units_in_stock=100
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product
```

EDGE CASE TESTS (backend/tests/unit/test_edge_cases.py):
```python
import pytest
from decimal import Decimal
from app.services.product_service import ProductService
from app.services.order_service import OrderService
from app.utils.exceptions import ValidationError, NotFoundError, ConflictError

class TestProductEdgeCases:
    def test_create_product_with_negative_price(self, db_session):
        """Should reject negative prices."""
        service = ProductService(db_session)
        with pytest.raises(ValidationError):
            service.create(ProductCreate(
                product_name="Bad Product",
                unit_price=Decimal("-10.00")
            ))
    
    def test_update_units_below_zero(self, db_session, sample_product):
        """Should not allow negative stock."""
        service = ProductService(db_session)
        with pytest.raises(ValidationError):
            service.update(sample_product.product_id, ProductUpdate(units_in_stock=-5))
    
    def test_discontinue_already_discontinued(self, db_session, sample_product):
        """Discontinuing already discontinued product should not error."""
        service = ProductService(db_session)
        sample_product.discontinued = True
        db_session.commit()
        
        # Should not raise
        result = service.discontinue(sample_product.product_id)
        assert result.discontinued == True


class TestOrderEdgeCases:
    def test_create_order_with_no_items(self, db_session, sample_customer):
        """Should reject orders with no items."""
        service = OrderService(db_session)
        with pytest.raises(ValidationError):
            service.create(OrderCreate(
                customer_id=sample_customer.customer_id,
                order_details=[]
            ))
    
    def test_order_with_discontinued_product(self, db_session, sample_customer, sample_product):
        """Should warn but allow ordering discontinued products."""
        sample_product.discontinued = True
        db_session.commit()
        
        service = OrderService(db_session)
        order = service.create(OrderCreate(
            customer_id=sample_customer.customer_id,
            order_details=[{
                "product_id": sample_product.product_id,
                "quantity": 1
            }]
        ))
        assert order is not None
    
    def test_invalid_status_transition(self, db_session, sample_order):
        """Should reject invalid status transitions."""
        service = OrderService(db_session)
        sample_order.status = OrderStatus.DELIVERED
        db_session.commit()
        
        with pytest.raises(ValidationError):
            service.update_status(sample_order.order_id, OrderStatus.PENDING)


class TestAuthEdgeCases:
    def test_login_with_inactive_user(self, client, db_session, admin_user):
        """Inactive users should not be able to login."""
        admin_user.is_active = False
        db_session.commit()
        
        response = client.post("/api/v1/auth/login", json={
            "username": "testadmin",
            "password": "TestAdmin123!"
        })
        assert response.status_code == 401
    
    def test_expired_token_rejected(self, client):
        """Expired tokens should be rejected."""
        # Token with past expiration
        expired_token = "eyJ..."  # Generate actual expired token
        
        response = client.get(
            "/api/v1/categories",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401
```

ALL ENDPOINTS INTEGRATION TESTS:
Create comprehensive integration tests for each entity:
- tests/integration/test_categories_full.py
- tests/integration/test_suppliers_full.py
- tests/integration/test_products_full.py
- tests/integration/test_customers_full.py
- tests/integration/test_employees_full.py
- tests/integration/test_orders_full.py
- tests/integration/test_users_full.py
- tests/integration/test_dashboard.py

Each file should test:
- All CRUD endpoints
- All filter/search/sort combinations
- Pagination
- Error responses
- Role-based access

GITHUB ACTIONS WORKFLOW (.github/workflows/test.yml):
```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: northwind_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov
      
      - name: Run tests with coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/northwind_test
          SECRET_KEY: test-secret-key
        run: |
          cd backend
          pytest --cov=app --cov-report=xml --cov-report=html
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml
```

PACKAGE.JSON SCRIPTS:
```json
{
  "scripts": {
    "test": "pytest",
    "test:coverage": "pytest --cov=app --cov-report=html",
    "test:ci": "pytest --cov=app --cov-report=xml"
  }
}
```

VERIFICATION:
1. Run: cd backend && pytest --cov=app
2. Check coverage report: open htmlcov/index.html
3. Target: >80% coverage

SUCCESS CRITERIA:
- All unit tests pass
- All integration tests pass
- Coverage >80%
- CI workflow configured
- Edge cases handled
```

---

## Next Step
Proceed to [Prompt 29: UI Polish & Error Handling](./29-ui-polish.md)
