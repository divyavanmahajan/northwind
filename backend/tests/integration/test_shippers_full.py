import pytest
from fastapi.testclient import TestClient
from app.models.user import UserRole

class TestShippersAPI:
    def test_list_shippers_unauthorized(self, client: TestClient):
        response = client.get("/api/v1/shippers")
        assert response.status_code == 401
    
    def test_list_shippers_authorized(self, client: TestClient, admin_token: str):
        response = client.get(
            "/api/v1/shippers",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_crud_shipper_admin(self, client: TestClient, admin_token: str):
        # Create
        create_res = client.post(
            "/api/v1/shippers",
            json={"company_name": "Fast Shipping", "phone": "555-0101"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert create_res.status_code == 201
        shipper_id = create_res.json()["shipper_id"]
        
        # Get
        get_res = client.get(
            f"/api/v1/shippers/{shipper_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert get_res.status_code == 200
        assert get_res.json()["company_name"] == "Fast Shipping"
        
        # Update
        update_res = client.put(
            f"/api/v1/shippers/{shipper_id}",
            json={"company_name": "Super Fast Shipping"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert update_res.status_code == 200
        assert update_res.json()["company_name"] == "Super Fast Shipping"
        
        # Delete
        delete_res = client.delete(
            f"/api/v1/shippers/{shipper_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_res.status_code == 204
        
        # Verify
        get_res_deleted = client.get(
            f"/api/v1/shippers/{shipper_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert get_res_deleted.status_code == 404

    def test_create_shipper_manager(self, client: TestClient, db_session):
        # Create a manager user
        from app.services.user_service import UserService
        from app.schemas.user import UserCreate
        service = UserService(db_session)
        service.create(UserCreate(
            username="testmanager",
            email="manager@test.com",
            password="Manager123!",
            role=UserRole.MANAGER
        ))
        
        login_res = client.post("/api/v1/auth/login", json={
            "username": "testmanager",
            "password": "Manager123!"
        })
        token = login_res.json()["access_token"]
        
        response = client.post(
            "/api/v1/shippers",
            json={"company_name": "Manager Ship", "phone": "555-0102"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 201

    def test_delete_shipper_non_admin_fails(self, client: TestClient, db_session):
        # Create an employee user
        from app.services.user_service import UserService
        from app.schemas.user import UserCreate
        service = UserService(db_session)
        service.create(UserCreate(
            username="testemp2",
            email="emp2@test.com",
            password="Employee123!",
            role=UserRole.EMPLOYEE
        ))
        
        login_res = client.post("/api/v1/auth/login", json={
            "username": "testemp2",
            "password": "Employee123!"
        })
        token = login_res.json()["access_token"]
        
        response = client.delete(
            "/api/v1/shippers/1",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
