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
    # Base.metadata.create_all(bind=engine)
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