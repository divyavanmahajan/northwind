import pytest
from app.utils.password import hash_password, verify_password, PasswordValidator
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import UserRole

class TestPasswordUtils:
    def test_hash_password_returns_hash(self):
        password = "TestPassword123!"
        hashed = hash_password(password)
        assert hashed != password
        assert hashed.startswith("$2b$")
    
    def test_verify_password_correct(self):
        password = "TestPassword123!"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True
    
    def test_verify_password_incorrect(self):
        password = "TestPassword123!"
        hashed = hash_password(password)
        assert verify_password("WrongPassword123!", hashed) is False
    
    def test_password_validator_valid(self):
        is_valid, errors = PasswordValidator.validate("ValidPass123!")
        assert is_valid is True
        assert len(errors) == 0
    
    def test_password_validator_too_short(self):
        is_valid, errors = PasswordValidator.validate("Ab1!")
        assert is_valid is False
        assert any("characters" in e for e in errors)
    
    def test_password_validator_no_uppercase(self):
        is_valid, errors = PasswordValidator.validate("password123!")
        assert is_valid is False
        assert any("uppercase" in e for e in errors)
    
    def test_password_validator_no_special(self):
        is_valid, errors = PasswordValidator.validate("Password123")
        assert is_valid is False
        assert any("special" in e for e in errors)

class TestUserSchemas:
    def test_user_create_valid(self):
        user = UserCreate(
            username="testuser",
            email="test@example.com",
            password="ValidPass123!",
            role=UserRole.EMPLOYEE
        )
        assert user.username == "testuser"
    
    def test_user_create_invalid_password(self):
        with pytest.raises(ValueError):
            UserCreate(
                username="testuser",
                email="test@example.com",
                password="weak",
                role=UserRole.EMPLOYEE
            )
    
    def test_user_create_invalid_email(self):
        with pytest.raises(ValueError):
            UserCreate(
                username="testuser",
                email="invalid-email",
                password="ValidPass123!",
                role=UserRole.EMPLOYEE
            )
