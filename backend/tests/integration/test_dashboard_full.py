import pytest
from fastapi.testclient import TestClient
from app.models.user import UserRole

class TestDashboardAPI:
    def test_admin_dashboard_unauthorized(self, client: TestClient):
        response = client.get("/api/v1/dashboard/admin")
        assert response.status_code == 401

    def test_admin_dashboard_authorized(self, client: TestClient, admin_token: str):
        response = client.get(
            "/api/v1/dashboard/admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_stats" in data
        assert "sales_overview" in data

    def test_manager_dashboard_authorized(self, client: TestClient, db_session):
        # Create a manager user
        from app.services.user_service import UserService
        from app.schemas.user import UserCreate
        service = UserService(db_session)
        service.create(UserCreate(
            username="testmanager_dash",
            email="manager_dash@test.com",
            password="Manager123!",
            role=UserRole.MANAGER
        ))
        
        login_res = client.post("/api/v1/auth/login", json={
            "username": "testmanager_dash",
            "password": "Manager123!"
        })
        token = login_res.json()["access_token"]
        
        response = client.get(
            "/api/v1/dashboard/manager",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200

    def test_employee_dashboard_authorized(self, client: TestClient, employee_token: str):
        response = client.get(
            "/api/v1/dashboard/employee",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_products" in data
        assert "product_inventory" in data

    def test_customer_dashboard_authorized(self, client: TestClient, db_session, test_customer_user, test_customer):
        # Link customer to user
        test_customer.user_id = test_customer_user.user_id
        db_session.commit()

        login_res = client.post("/api/v1/auth/login", json={
            "username": test_customer_user.username,
            "password": "TestCustomer123!"
        })
        token = login_res.json()["access_token"]
        
        response = client.get(
            "/api/v1/dashboard/customer",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "my_stats" in data
