import pytest
from fastapi.testclient import TestClient

class TestSuppliersAPI:
    def test_list_suppliers_unauthorized(self, client: TestClient):
        response = client.get("/api/v1/suppliers")
        assert response.status_code == 401
    
    def test_list_suppliers_authorized(self, client: TestClient, auth_token: str):
        response = client.get(
            "/api/v1/suppliers",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data
    
    def test_create_supplier_as_admin(self, client: TestClient, admin_token: str):
        response = client.post(
            "/api/v1/suppliers",
            json={
                "company_name": "API Test Supplier",
                "contact_name": "Test Contact",
                "country": "Germany"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["company_name"] == "API Test Supplier"
        assert data["supplier_id"] is not None
    
    def test_create_supplier_as_employee(self, client: TestClient, auth_token: str):
        response = client.post(
            "/api/v1/suppliers",
            json={"company_name": "Should Fail"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 403
    
    def test_get_single_supplier(self, client: TestClient, admin_token: str):
        # Create
        create_response = client.post(
            "/api/v1/suppliers",
            json={"company_name": "Get Test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        supplier_id = create_response.json()["supplier_id"]
        
        # Get
        response = client.get(
            f"/api/v1/suppliers/{supplier_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["supplier_id"] == supplier_id
    
    def test_update_supplier(self, client: TestClient, admin_token: str):
        # Create
        create_response = client.post(
            "/api/v1/suppliers",
            json={"company_name": "Update Test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        supplier_id = create_response.json()["supplier_id"]
        
        # Update
        response = client.put(
            f"/api/v1/suppliers/{supplier_id}",
            json={"company_name": "Updated API Name"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["company_name"] == "Updated API Name"
    
    def test_delete_supplier(self, client: TestClient, admin_token: str):
        # Create
        create_response = client.post(
            "/api/v1/suppliers",
            json={"company_name": "Delete Test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        supplier_id = create_response.json()["supplier_id"]
        
        # Delete
        response = client.delete(
            f"/api/v1/suppliers/{supplier_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        # Verify it's gone from list (soft deleted)
        get_response = client.get(
            f"/api/v1/suppliers/{supplier_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert get_response.status_code == 404

    def test_get_countries_and_cities(self, client: TestClient, auth_token: str):
        response = client.get(
            "/api/v1/suppliers/filters/countries",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

        response = client.get(
            "/api/v1/suppliers/filters/cities",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
