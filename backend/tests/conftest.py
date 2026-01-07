import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from datetime import date

from app.main import app
from app.database import Base, get_db
from app.models import *
from app.services.user_service import UserService
from app.schemas.user import UserCreate
from app.models.user import UserRole

# Use in-memory SQLite for tests to ensure a clean state and speed
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
def db(db_session):
    """Alias for db_session to maintain compatibility with existing tests."""
    return db_session


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
def auth_token(employee_token):
    """Alias for employee_token to maintain compatibility."""
    return employee_token


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

@pytest.fixture
def test_product(sample_product):
    """Alias for sample_product."""
    return sample_product


@pytest.fixture
def test_customer_user(db_session):
    """Create a test customer user."""
    service = UserService(db_session)
    return service.create(UserCreate(
        username="testcustomer",
        email="testcustomer@test.com",
        password="TestCustomer123!",
        role=UserRole.CUSTOMER
    ))


@pytest.fixture
def test_customer(db_session):
    """Create a test customer."""
    customer = Customer(
        customer_id="ALFKI",
        company_name="Alfreds Futterkiste",
        contact_name="Maria Anders",
        city="Berlin",
        country="Germany"
    )
    db_session.add(customer)
    db_session.commit()
    db_session.refresh(customer)
    return customer


@pytest.fixture
def test_employee(db_session):
    """Create a test employee."""
    employee = Employee(
        last_name="Davolio",
        first_name="Nancy",
        title="Sales Representative",
        birth_date=date(1948, 12, 8),
        hire_date=date(1992, 5, 1)
    )
    db_session.add(employee)
    db_session.commit()
    db_session.refresh(employee)
    return employee


@pytest.fixture
def sample_customer(test_customer):
    """Alias for sample_customer."""
    return test_customer


@pytest.fixture
def sample_employee(test_employee):
    """Alias for sample_employee."""
    return test_employee