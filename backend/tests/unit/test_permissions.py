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
