import pytest
from app.services.user_service import UserService
from app.schemas.user import UserCreate
from app.models.user import UserRole
from app.utils.exceptions import ConflictError

class TestUserService:
    def test_create_user(self, db_session):
        service = UserService(db_session)
        user_data = UserCreate(
            username="newuser",
            email="new@example.com",
            password="ValidPass123!",
            role=UserRole.EMPLOYEE
        )
        user = service.create(user_data)
        assert user.user_id is not None
        assert user.username == "newuser"
    
    def test_create_user_duplicate_username(self, db_session):
        service = UserService(db_session)
        user_data = UserCreate(
            username="duplicate",
            email="first@example.com",
            password="ValidPass123!",
            role=UserRole.EMPLOYEE
        )
        service.create(user_data)
        
        with pytest.raises(ConflictError):
            user_data.email = "second@example.com"
            service.create(user_data)
    
    def test_get_by_username(self, db_session):
        service = UserService(db_session)
        user_data = UserCreate(
            username="findme",
            email="findme@example.com",
            password="ValidPass123!",
            role=UserRole.EMPLOYEE
        )
        created = service.create(user_data)
        found = service.get_by_username("findme")
        assert found.user_id == created.user_id
