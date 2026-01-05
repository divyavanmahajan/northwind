# Prompt 06: User Model & Password Security

## Context
Beginning Phase 2: Authentication & Users. We now create the User model with secure password handling using bcrypt, establishing the foundation for the authentication system.

## Prerequisites
- Completed Phase 1 (Prompts 01-05)
- Database connection working
- Alembic migrations configured

## Goals
1. Create User SQLAlchemy model
2. Implement secure password hashing with bcrypt
3. Create user schema with validation
4. Set up password validation rules
5. Write first user-related database migration
6. Create comprehensive unit tests

---

## Prompt

```text
Create the User model with secure password handling for the Northwind authentication system.

DEPENDENCIES:
Update backend/requirements.txt to add:
- passlib[bcrypt]>=1.7.0
- bcrypt>=4.0.0
- email-validator>=2.0.0

USER MODEL (backend/app/models/user.py):
Create the User model with:

```python
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"
    CUSTOMER = "customer"

class User(Base, TimestampMixin):
    __tablename__ = "users"
    
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.EMPLOYEE)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    
    # Relationships (to be expanded later)
    creator = relationship("User", remote_side=[user_id], foreign_keys=[created_by])
```

PASSWORD UTILITIES (backend/app/utils/password.py):
Create password handling utilities:

```python
from passlib.context import CryptContext
import re

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class PasswordValidator:
    MIN_LENGTH = 8
    
    @staticmethod
    def validate(password: str) -> tuple[bool, list[str]]:
        """Validate password meets requirements. Returns (is_valid, errors)."""
        errors = []
        
        if len(password) < PasswordValidator.MIN_LENGTH:
            errors.append(f"Password must be at least {PasswordValidator.MIN_LENGTH} characters")
        if not re.search(r"[A-Z]", password):
            errors.append("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", password):
            errors.append("Password must contain at least one lowercase letter")
        if not re.search(r"\d", password):
            errors.append("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            errors.append("Password must contain at least one special character")
            
        return len(errors) == 0, errors

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)
```

USER SCHEMAS (backend/app/schemas/user.py):
Create Pydantic schemas:

```python
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.user import UserRole

# Base schema with common fields
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: UserRole = UserRole.EMPLOYEE

# Schema for creating users
class UserCreate(UserBase):
    password: str
    
    @field_validator('username')
    @classmethod
    def username_valid(cls, v: str) -> str:
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if len(v) > 50:
            raise ValueError('Username must be at most 50 characters')
        if not v.isalnum() and '_' not in v:
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v.lower()
    
    @field_validator('password')
    @classmethod
    def password_valid(cls, v: str) -> str:
        from app.utils.password import PasswordValidator
        is_valid, errors = PasswordValidator.validate(v)
        if not is_valid:
            raise ValueError('; '.join(errors))
        return v

# Schema for updating users (all fields optional)
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

# Schema for password change
class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def password_valid(cls, v: str) -> str:
        from app.utils.password import PasswordValidator
        is_valid, errors = PasswordValidator.validate(v)
        if not is_valid:
            raise ValueError('; '.join(errors))
        return v

# Schema for responses (no password)
class UserResponse(UserBase):
    user_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# Schema for user in token
class UserInToken(BaseModel):
    user_id: UUID
    username: str
    role: UserRole
```

USER SERVICE (backend/app/services/user_service.py):
Create service layer for user operations:

```python
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.utils.password import hash_password
from app.utils.exceptions import NotFoundError, ConflictError

class UserService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, user_id: UUID) -> Optional[User]:
        return self.db.query(User).filter(User.user_id == user_id).first()
    
    def get_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username.lower()).first()
    
    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email.lower()).first()
    
    def create(self, user_data: UserCreate, created_by: Optional[UUID] = None) -> User:
        # Check for existing username
        if self.get_by_username(user_data.username):
            raise ConflictError("Username already exists")
        
        # Check for existing email
        if self.get_by_email(user_data.email):
            raise ConflictError("Email already exists")
        
        user = User(
            username=user_data.username.lower(),
            email=user_data.email.lower(),
            password_hash=hash_password(user_data.password),
            role=user_data.role,
            created_by=created_by
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def update(self, user_id: UUID, user_data: UserUpdate) -> User:
        user = self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        update_data = user_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def delete(self, user_id: UUID) -> bool:
        user = self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        user.is_active = False
        self.db.commit()
        return True
```

DATABASE MIGRATION:
Create migration for users table:
```bash
alembic revision --autogenerate -m "create_users_table"
alembic upgrade head
```

MODELS __init__.py UPDATE:
Update backend/app/models/__init__.py to export all models:
```python
from .base import TimestampMixin, SoftDeleteMixin
from .user import User, UserRole

__all__ = ["TimestampMixin", "SoftDeleteMixin", "User", "UserRole"]
```

UNIT TESTS (backend/tests/unit/test_user.py):
Create comprehensive tests:

```python
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
        assert any("8 characters" in e for e in errors)
    
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
```

INTEGRATION TESTS (backend/tests/integration/test_user_service.py):
```python
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
```

VERIFICATION:
1. Run migration: docker-compose exec backend alembic upgrade head
2. Verify table: docker-compose exec db psql -U postgres -d northwind -c "\d users"
3. Run tests: docker-compose exec backend pytest tests/unit/test_user.py -v
4. Run integration tests: docker-compose exec backend pytest tests/integration/test_user_service.py -v

SUCCESS CRITERIA:
- User model created with all fields
- Password hashing works correctly
- Password validation enforces rules
- User schemas validate input
- User service implements CRUD
- Migration creates users table
- All tests pass
```

---

## Verification Checklist

- [ ] User model created with all required fields
- [ ] Password hashing with bcrypt works
- [ ] Password validation rules enforced
- [ ] User schemas with proper validation
- [ ] UserService implements all operations
- [ ] Migration creates users table correctly
- [ ] Unit tests for password utilities pass
- [ ] Unit tests for schemas pass
- [ ] Integration tests for service pass

---

## Next Step
Proceed to [Prompt 07: JWT Authentication Endpoints](./07-jwt-auth.md)
