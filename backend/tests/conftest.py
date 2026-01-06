import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.config import settings
from app.services.user_service import UserService
from app.schemas.user import UserCreate
from app.auth.service import AuthService
from app.models.user import UserRole

# Use a test database or just the dev one for now as per instructions
# In a real scenario, we'd use a separate test DB or SQLite
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module")
def db(db_session):
    return db_session

@pytest.fixture(scope="module")
def client():
    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c

@pytest.fixture
def auth_token(db_session):
    """Create a test user and return their auth token."""
    service = UserService(db_session)
    auth = AuthService(db_session)
    
    username = "testauth"
    password = "TestAuth123!"
    
    user = service.get_by_username(username)
    if not user:
        user = service.create(UserCreate(
            username=username,
            email="testauth@example.com",
            password=password,
            role=UserRole.EMPLOYEE
        ))
    
    _, tokens = auth.login(username, password)
    return tokens["access_token"]

@pytest.fixture
def admin_token(db_session):
    """Create an admin user and return their auth token."""
    service = UserService(db_session)
    auth = AuthService(db_session)
    
    username = "testadmin"
    password = "TestAdmin123!"
    
    user = service.get_by_username(username)
    if not user:
        user = service.create(UserCreate(
            username=username,
            email="testadmin@example.com",
            password=password,
            role=UserRole.ADMIN
        ))
    
    _, tokens = auth.login(username, password)
    return tokens["access_token"]

@pytest.fixture
def test_customer_user(db):
    service = UserService(db)
    password = "TestCustomer123!"
    username = "testcustomer"
    user = service.get_by_username(username)
    if user:
        # Cleanup existing user to ensure fresh state with new password
        from app.models.customer import Customer
        linked = db.query(Customer).filter(Customer.user_id == user.user_id).first()
        if linked:
            linked.user_id = None
            db.commit()
        db.delete(user)
        db.commit()
        user = None

    if not user:
        user = service.create(UserCreate(
            username=username,
            email="testcustomer@example.com",
            password=password,
            role=UserRole.CUSTOMER
        ))
    return user

@pytest.fixture
def test_customer(db):
    from app.models.customer import Customer
    customer = db.query(Customer).filter(Customer.customer_id == "ALFKI").first()
    if not customer:
        customer = Customer(
            customer_id="ALFKI",
            company_name="Alfreds Futterkiste",
            contact_name="Maria Anders",
            city="Berlin",
            country="Germany"
        )
        db.add(customer)
    else:
        # Ensure it's not deleted
        customer.deleted_at = None
        # Reset other fields if needed to known state
        customer.company_name="Alfreds Futterkiste"
        customer.contact_name="Maria Anders"
    
    db.commit()
    db.refresh(customer)
    return customer