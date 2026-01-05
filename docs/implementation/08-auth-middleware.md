# Prompt 08: Auth Middleware & Protected Routes (Backend)

## Context
With JWT authentication working, we now implement middleware to protect API routes and enforce role-based access control.

## Prerequisites
- Completed Prompt 07 (JWT Authentication Endpoints)
- Login endpoint working

## Goals
1. Create authentication dependency
2. Implement role-based authorization
3. Create protected route decorator
4. Add "me" endpoint for current user
5. Implement permission checking
6. Write authorization tests

---

## Prompt

```text
Implement authentication middleware and role-based access control for protected API routes.

AUTH DEPENDENCIES (backend/app/auth/dependencies.py):
Create authentication dependencies for FastAPI:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.auth.jwt import decode_token, TokenData
from app.models.user import User, UserRole
from app.services.user_service import UserService

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency that extracts and validates the JWT token,
    then returns the current user.
    """
    token = credentials.credentials
    token_data = decode_token(token)
    
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user_service = UserService(db)
    user = user_service.get_by_id(token_data.user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Alias for get_current_user that emphasizes active status."""
    return current_user

def require_roles(allowed_roles: List[UserRole]):
    """
    Dependency factory that checks if user has required role.
    
    Usage:
        @router.get("/admin-only")
        def admin_route(user: User = Depends(require_roles([UserRole.ADMIN]))):
            ...
    """
    async def role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' not authorized for this resource"
            )
        return current_user
    
    return role_checker

# Convenience dependencies for common role combinations
require_admin = require_roles([UserRole.ADMIN])
require_manager_or_admin = require_roles([UserRole.ADMIN, UserRole.MANAGER])
require_employee_or_above = require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE])
```

PERMISSION SYSTEM (backend/app/auth/permissions.py):
Create a more granular permission system:

```python
from enum import Enum
from typing import Dict, Set
from app.models.user import UserRole

class Permission(str, Enum):
    # User management
    USER_READ = "user:read"
    USER_CREATE = "user:create"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    
    # Product management
    PRODUCT_READ = "product:read"
    PRODUCT_CREATE = "product:create"
    PRODUCT_UPDATE = "product:update"
    PRODUCT_DELETE = "product:delete"
    
    # Order management
    ORDER_READ = "order:read"
    ORDER_READ_OWN = "order:read:own"
    ORDER_CREATE = "order:create"
    ORDER_UPDATE = "order:update"
    ORDER_DELETE = "order:delete"
    
    # Customer management
    CUSTOMER_READ = "customer:read"
    CUSTOMER_READ_OWN = "customer:read:own"
    CUSTOMER_CREATE = "customer:create"
    CUSTOMER_UPDATE = "customer:update"
    CUSTOMER_DELETE = "customer:delete"
    
    # Employee management
    EMPLOYEE_READ = "employee:read"
    EMPLOYEE_CREATE = "employee:create"
    EMPLOYEE_UPDATE = "employee:update"
    EMPLOYEE_DELETE = "employee:delete"
    
    # Dashboard
    DASHBOARD_ADMIN = "dashboard:admin"
    DASHBOARD_MANAGER = "dashboard:manager"
    DASHBOARD_EMPLOYEE = "dashboard:employee"
    DASHBOARD_CUSTOMER = "dashboard:customer"

# Role to permissions mapping
ROLE_PERMISSIONS: Dict[UserRole, Set[Permission]] = {
    UserRole.ADMIN: set(Permission),  # All permissions
    
    UserRole.MANAGER: {
        Permission.PRODUCT_READ, Permission.PRODUCT_CREATE, 
        Permission.PRODUCT_UPDATE, Permission.PRODUCT_DELETE,
        Permission.ORDER_READ, Permission.ORDER_CREATE,
        Permission.ORDER_UPDATE, Permission.ORDER_DELETE,
        Permission.CUSTOMER_READ, Permission.CUSTOMER_CREATE,
        Permission.CUSTOMER_UPDATE, Permission.CUSTOMER_DELETE,
        Permission.EMPLOYEE_READ,
        Permission.DASHBOARD_MANAGER,
    },
    
    UserRole.EMPLOYEE: {
        Permission.PRODUCT_READ,
        Permission.ORDER_READ,
        Permission.CUSTOMER_READ,
        Permission.EMPLOYEE_READ,
        Permission.DASHBOARD_EMPLOYEE,
    },
    
    UserRole.CUSTOMER: {
        Permission.PRODUCT_READ,
        Permission.ORDER_READ_OWN,
        Permission.CUSTOMER_READ_OWN,
        Permission.DASHBOARD_CUSTOMER,
    },
}

def has_permission(role: UserRole, permission: Permission) -> bool:
    """Check if a role has a specific permission."""
    return permission in ROLE_PERMISSIONS.get(role, set())

def get_permissions(role: UserRole) -> Set[Permission]:
    """Get all permissions for a role."""
    return ROLE_PERMISSIONS.get(role, set())
```

ME ENDPOINT (update backend/app/routers/auth.py):
Add endpoint for current user:

```python
from app.auth.dependencies import get_current_user
from app.auth.permissions import get_permissions

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's information.
    
    Requires valid JWT token in Authorization header.
    """
    return UserResponse.model_validate(current_user)

@router.get("/me/permissions")
def get_my_permissions(current_user: User = Depends(get_current_user)):
    """
    Get current user's permissions.
    """
    permissions = get_permissions(current_user.role)
    return {
        "user_id": str(current_user.user_id),
        "username": current_user.username,
        "role": current_user.role.value,
        "permissions": [p.value for p in permissions]
    }
```

OPTIONAL USER DEPENDENCY (backend/app/auth/dependencies.py):
Add optional auth for public routes that behave differently for authenticated users:

```python
from fastapi.security import HTTPBearer
from fastapi import Request

class OptionalHTTPBearer(HTTPBearer):
    async def __call__(self, request: Request):
        try:
            return await super().__call__(request)
        except HTTPException:
            return None

optional_security = OptionalHTTPBearer(auto_error=False)

async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Returns current user if authenticated, None otherwise.
    Useful for routes that have different behavior for authenticated users.
    """
    if credentials is None:
        return None
    
    token_data = decode_token(credentials.credentials)
    if token_data is None:
        return None
    
    user_service = UserService(db)
    return user_service.get_by_id(token_data.user_id)
```

UNIT TESTS (backend/tests/unit/test_permissions.py):
```python
import pytest
from app.auth.permissions import Permission, has_permission, get_permissions
from app.models.user import UserRole

class TestPermissions:
    def test_admin_has_all_permissions(self):
        for permission in Permission:
            assert has_permission(UserRole.ADMIN, permission) is True
    
    def test_manager_permissions(self):
        assert has_permission(UserRole.MANAGER, Permission.PRODUCT_CREATE) is True
        assert has_permission(UserRole.MANAGER, Permission.USER_CREATE) is False
    
    def test_employee_read_only(self):
        assert has_permission(UserRole.EMPLOYEE, Permission.PRODUCT_READ) is True
        assert has_permission(UserRole.EMPLOYEE, Permission.PRODUCT_CREATE) is False
    
    def test_customer_limited_access(self):
        assert has_permission(UserRole.CUSTOMER, Permission.PRODUCT_READ) is True
        assert has_permission(UserRole.CUSTOMER, Permission.ORDER_READ_OWN) is True
        assert has_permission(UserRole.CUSTOMER, Permission.ORDER_READ) is False
    
    def test_get_permissions_returns_set(self):
        permissions = get_permissions(UserRole.MANAGER)
        assert isinstance(permissions, set)
        assert Permission.PRODUCT_READ in permissions
```

INTEGRATION TESTS (backend/tests/integration/test_protected_routes.py):
```python
import pytest
from fastapi.testclient import TestClient

class TestProtectedRoutes:
    def test_me_without_token(self, client: TestClient):
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 403  # No credentials
    
    def test_me_with_invalid_token(self, client: TestClient):
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"}
        )
        assert response.status_code == 401
    
    def test_me_with_valid_token(self, client: TestClient, auth_token: str):
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "username" in data
        assert "role" in data
    
    def test_permissions_endpoint(self, client: TestClient, admin_token: str):
        response = client.get(
            "/api/v1/auth/me/permissions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "permissions" in data
        assert len(data["permissions"]) > 0
```

UPDATE CONFTEST (backend/tests/conftest.py):
Add fixtures for authenticated requests:

```python
import pytest
from app.services.user_service import UserService
from app.schemas.user import UserCreate
from app.auth.service import AuthService
from app.models.user import UserRole

@pytest.fixture
def auth_token(db_session):
    """Create a test user and return their auth token."""
    service = UserService(db_session)
    auth = AuthService(db_session)
    
    try:
        user = service.create(UserCreate(
            username="testauth",
            email="testauth@example.com",
            password="TestAuth123!",
            role=UserRole.EMPLOYEE
        ))
    except:
        user = service.get_by_username("testauth")
    
    _, tokens = auth.login("testauth", "TestAuth123!")
    return tokens["access_token"]

@pytest.fixture
def admin_token(db_session):
    """Create an admin user and return their auth token."""
    service = UserService(db_session)
    auth = AuthService(db_session)
    
    try:
        user = service.create(UserCreate(
            username="testadmin",
            email="testadmin@example.com",
            password="TestAdmin123!",
            role=UserRole.ADMIN
        ))
    except:
        user = service.get_by_username("testadmin")
    
    _, tokens = auth.login("testadmin", "TestAdmin123!")
    return tokens["access_token"]
```

VERIFICATION:
1. Rebuild: docker-compose up -d --build backend
2. Get token: 
   TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "Admin123!"}' | jq -r '.access_token')
3. Test /me:
   curl http://localhost:8000/api/v1/auth/me \
     -H "Authorization: Bearer $TOKEN"
4. Test permissions:
   curl http://localhost:8000/api/v1/auth/me/permissions \
     -H "Authorization: Bearer $TOKEN"
5. Test without token (should fail):
   curl http://localhost:8000/api/v1/auth/me
6. Run tests: docker-compose exec backend pytest tests/ -v

SUCCESS CRITERIA:
- get_current_user dependency works
- Role-based authorization works
- /me endpoint returns user info
- /me/permissions returns user permissions
- Requests without token are rejected
- Requests with invalid token are rejected
- Permission system correctly maps roles
- All tests pass
```

---

## Verification Checklist

- [ ] get_current_user dependency extracts user from token
- [ ] require_roles checks user role correctly
- [ ] Permission system maps roles to permissions
- [ ] /me endpoint returns current user
- [ ] /me/permissions returns user's permissions
- [ ] Unauthenticated requests return 401/403
- [ ] Invalid tokens return 401
- [ ] Test fixtures for auth tokens work
- [ ] All tests pass

---

## Next Step
Proceed to [Prompt 09: Frontend Auth Store & Login Page](./09-frontend-auth.md)
