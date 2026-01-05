# Prompt 07: JWT Authentication Endpoints

## Context
With the User model and password security in place, we now implement JWT-based authentication endpoints for login and token management.

## Prerequisites
- Completed Prompt 06 (User Model & Password Security)
- Users table exists in database

## Goals
1. Implement JWT token generation and validation
2. Create login endpoint
3. Create token refresh endpoint
4. Create "me" endpoint for current user
5. Add rate limiting placeholder
6. Write comprehensive tests

---

## Prompt

```text
Implement JWT authentication endpoints for the Northwind API.

DEPENDENCIES:
Update backend/requirements.txt to add:
- python-jose[cryptography]>=3.3.0

JWT UTILITIES (backend/app/auth/jwt.py):
Create JWT handling utilities:

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from uuid import UUID
from app.config import settings
from app.models.user import UserRole

class TokenData:
    def __init__(self, user_id: UUID, username: str, role: UserRole, exp: datetime):
        self.user_id = user_id
        self.username = username
        self.role = role
        self.exp = exp

def create_access_token(
    user_id: UUID,
    username: str,
    role: UserRole,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(seconds=settings.JWT_EXPIRATION)
    
    payload = {
        "sub": str(user_id),
        "username": username,
        "role": role.value,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    }
    
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> Optional[TokenData]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        user_id = UUID(payload.get("sub"))
        username = payload.get("username")
        role = UserRole(payload.get("role"))
        exp = datetime.fromtimestamp(payload.get("exp"))
        
        return TokenData(user_id, username, role, exp)
    except (JWTError, ValueError, KeyError):
        return None

def is_token_expired(token_data: TokenData) -> bool:
    """Check if token is expired."""
    return datetime.utcnow() > token_data.exp
```

AUTH SCHEMAS (backend/app/schemas/auth.py):
Create authentication schemas:

```python
from pydantic import BaseModel
from app.schemas.user import UserResponse

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class TokenRefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
```

AUTH SERVICE (backend/app/auth/service.py):
Create authentication service:

```python
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.models.user import User
from app.services.user_service import UserService
from app.utils.password import verify_password
from app.utils.exceptions import AuthenticationError
from app.auth.jwt import create_access_token
from app.config import settings

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_service = UserService(db)
    
    def authenticate(self, username: str, password: str) -> User:
        """Authenticate user with username and password."""
        user = self.user_service.get_by_username(username)
        
        if not user:
            # Use constant-time comparison to prevent timing attacks
            verify_password(password, "$2b$12$placeholder.hash.for.timing")
            raise AuthenticationError("Invalid username or password")
        
        if not verify_password(password, user.password_hash):
            raise AuthenticationError("Invalid username or password")
        
        if not user.is_active:
            raise AuthenticationError("Account is deactivated")
        
        # Update last login
        user.last_login = datetime.utcnow()
        self.db.commit()
        
        return user
    
    def create_tokens(self, user: User) -> dict:
        """Create access token for user."""
        access_token = create_access_token(
            user_id=user.user_id,
            username=user.username,
            role=user.role
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.JWT_EXPIRATION
        }
    
    def login(self, username: str, password: str) -> tuple[User, dict]:
        """Full login flow: authenticate and create tokens."""
        user = self.authenticate(username, password)
        tokens = self.create_tokens(user)
        return user, tokens
```

AUTH ROUTER (backend/app/routers/auth.py):
Create authentication endpoints:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import LoginRequest, LoginResponse
from app.schemas.user import UserResponse
from app.auth.service import AuthService
from app.utils.exceptions import AuthenticationError

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT token.
    
    - **username**: Username or email
    - **password**: User password
    """
    auth_service = AuthService(db)
    
    try:
        user, tokens = auth_service.login(request.username, request.password)
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return LoginResponse(
        access_token=tokens["access_token"],
        token_type=tokens["token_type"],
        expires_in=tokens["expires_in"],
        user=UserResponse.model_validate(user)
    )

@router.post("/logout")
def logout():
    """
    Logout user (client-side token removal).
    
    Note: JWT tokens are stateless. Client should remove token.
    For true logout, implement token blacklisting.
    """
    return {"message": "Logged out successfully"}
```

UPDATE MAIN.PY:
Register auth router:
```python
from app.routers import auth, health

app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
```

CREATE INITIAL ADMIN USER:
Create backend/scripts/create_admin.py:
```python
"""Script to create initial admin user."""
from app.database import SessionLocal
from app.services.user_service import UserService
from app.schemas.user import UserCreate
from app.models.user import UserRole

def create_admin():
    db = SessionLocal()
    try:
        service = UserService(db)
        
        # Check if admin exists
        if service.get_by_username("admin"):
            print("Admin user already exists")
            return
        
        admin = UserCreate(
            username="admin",
            email="admin@northwind.com",
            password="Admin123!",
            role=UserRole.ADMIN
        )
        
        user = service.create(admin)
        print(f"Created admin user: {user.username} ({user.user_id})")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
```

UNIT TESTS (backend/tests/unit/test_jwt.py):
```python
import pytest
from datetime import timedelta
from app.auth.jwt import create_access_token, decode_token, is_token_expired
from app.models.user import UserRole
from uuid import uuid4

class TestJWT:
    def test_create_access_token(self):
        user_id = uuid4()
        token = create_access_token(user_id, "testuser", UserRole.ADMIN)
        assert token is not None
        assert len(token) > 0
    
    def test_decode_token_valid(self):
        user_id = uuid4()
        token = create_access_token(user_id, "testuser", UserRole.MANAGER)
        data = decode_token(token)
        assert data is not None
        assert data.user_id == user_id
        assert data.username == "testuser"
        assert data.role == UserRole.MANAGER
    
    def test_decode_token_invalid(self):
        data = decode_token("invalid.token.here")
        assert data is None
    
    def test_decode_token_expired(self):
        user_id = uuid4()
        token = create_access_token(
            user_id, "testuser", UserRole.EMPLOYEE,
            expires_delta=timedelta(seconds=-1)  # Already expired
        )
        data = decode_token(token)
        # Jose will reject expired tokens
        assert data is None
```

INTEGRATION TESTS (backend/tests/integration/test_auth.py):
```python
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
        try:
            service.create(UserCreate(
                username="testuser",
                email="test@example.com",
                password="TestPass123!",
                role=UserRole.EMPLOYEE
            ))
        except:
            pass  # User might already exist
    
    def test_login_success(self, client: TestClient):
        response = client.post("/api/v1/auth/login", json={
            "username": "testuser",
            "password": "TestPass123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["username"] == "testuser"
    
    def test_login_invalid_password(self, client: TestClient):
        response = client.post("/api/v1/auth/login", json={
            "username": "testuser",
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
        user = service.get_by_username("testuser")
        user.is_active = False
        db_session.commit()
        
        response = client.post("/api/v1/auth/login", json={
            "username": "testuser",
            "password": "TestPass123!"
        })
        assert response.status_code == 401
```

VERIFICATION:
1. Rebuild: docker-compose up -d --build backend
2. Create admin: docker-compose exec backend python scripts/create_admin.py
3. Test login: 
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "Admin123!"}'
4. Run tests: docker-compose exec backend pytest tests/ -v

SUCCESS CRITERIA:
- JWT tokens generated correctly
- Login endpoint works with valid credentials
- Login fails with invalid credentials
- Login fails for inactive users
- Token contains correct user information
- Admin user can be created and login
- All tests pass
```

---

## Verification Checklist

- [ ] JWT utilities created
- [ ] Auth schemas defined
- [ ] Auth service implements login
- [ ] Login endpoint returns token
- [ ] Invalid credentials return 401
- [ ] Inactive users cannot login
- [ ] Admin creation script works
- [ ] All JWT tests pass
- [ ] All auth integration tests pass

---

## Next Step
Proceed to [Prompt 08: Auth Middleware & Protected Routes (Backend)](./08-auth-middleware.md)
