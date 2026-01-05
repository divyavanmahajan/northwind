import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.user_service import UserService
from app.schemas.user import UserCreate
from app.models.user import UserRole

class TestAuthEndpoints:
    @pytest.fixture(autouse=True)
    def setup(self, db_session):
        # Create test user
        service = UserService(db_session)
        # Clean up existing test user
        user = service.get_by_username("testuser_auth")
        if user:
            db_session.delete(user)
            db_session.commit()
            
        service.create(UserCreate(
            username="testuser_auth",
            email="test_auth@example.com",
            password="TestPass123!",
            role=UserRole.EMPLOYEE
        ))
    
    def test_login_success(self, client: TestClient):
        response = client.post("/api/v1/auth/login", json={
            "username": "testuser_auth",
            "password": "TestPass123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["username"] == "testuser_auth"
    
    def test_login_invalid_password(self, client: TestClient):
        response = client.post("/api/v1/auth/login", json={
            "username": "testuser_auth",
            "password": "WrongPassword123!"
        })
        assert response.status_code == 401
    
    def test_login_nonexistent_user(self, client: TestClient):
        response = client.post("/api/v1/auth/login", json={
            "username": "nonexistent",
            "password": "SomePass123!"
        })
        assert response.status_code == 401
    
    def test_login_inactive_user(self, client: TestClient, db_session):
        # Deactivate user
        service = UserService(db_session)
        user = service.get_by_username("testuser_auth")
        user.is_active = False
        db_session.commit()
        
        response = client.post("/api/v1/auth/login", json={
            "username": "testuser_auth",
            "password": "TestPass123!"
        })
        assert response.status_code == 401
