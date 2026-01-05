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
