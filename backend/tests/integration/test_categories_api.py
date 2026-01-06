import pytest
from fastapi.testclient import TestClient

class TestCategoriesAPI:
    def test_list_categories_unauthorized(self, client: TestClient):
        response = client.get("/api/v1/categories")
        # FastAPI HTTPBearer returns 401 for missing credentials
        assert response.status_code == 401
    
    def test_list_categories_authorized(self, client: TestClient, auth_token: str):
        response = client.get(
            "/api/v1/categories",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data
    
    def test_create_category_as_admin(self, client: TestClient, admin_token: str):
        suffix = "1767683404"
        response = client.post(
            "/api/v1/categories",
            json={"category_name": f"New Category {suffix}", "description": "Test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["category_name"] == f"New Category {suffix}"
    
    def test_create_category_as_employee(self, client: TestClient, auth_token: str):
        suffix = "1767683404"
        response = client.post(
            "/api/v1/categories",
            json={"category_name": f"Unauthorized {suffix}"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 403
    
    def test_get_single_category(self, client: TestClient, admin_token: str):
        suffix = "1767683404"
        # Create first
        create_response = client.post(
            "/api/v1/categories",
            json={"category_name": f"Get Test {suffix}"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        category_id = create_response.json()["category_id"]
        
        # Get
        response = client.get(
            f"/api/v1/categories/{category_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["category_id"] == category_id
    
    def test_update_category(self, client: TestClient, admin_token: str):
        suffix = "1767683404"
        # Create
        create_response = client.post(
            "/api/v1/categories",
            json={"category_name": f"Update Test {suffix}"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        category_id = create_response.json()["category_id"]
        
        # Update
        response = client.put(
            f"/api/v1/categories/{category_id}",
            json={"category_name": f"Updated Name {suffix}"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["category_name"] == f"Updated Name {suffix}"
    
    def test_delete_category(self, client: TestClient, admin_token: str):
        suffix = "1767683404"
        # Create
        create_response = client.post(
            "/api/v1/categories",
            json={"category_name": f"Delete Test {suffix}"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        category_id = create_response.json()["category_id"]
        
        # Delete
        response = client.delete(
            f"/api/v1/categories/{category_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
