import pytest
from fastapi.testclient import TestClient

class TestProtectedRoutes:
    def test_me_without_token(self, client: TestClient):
        response = client.get("/api/v1/auth/me")
        # FastAPI HTTPBearer returns 401 if header is missing
        assert response.status_code == 401
    
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
