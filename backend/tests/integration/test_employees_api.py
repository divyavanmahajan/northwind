import pytest
from fastapi.testclient import TestClient

class TestEmployeesAPI:
    def test_list_employees_unauthorized(self, client: TestClient):
        response = client.get("/api/v1/employees")
        assert response.status_code == 401
    
    def test_list_employees_authorized(self, client: TestClient, auth_token: str):
        response = client.get(
            "/api/v1/employees",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data
    
    def test_create_employee_as_admin(self, client: TestClient, admin_token: str):
        response = client.post(
            "/api/v1/employees",
            json={
                "last_name": "Doe",
                "first_name": "John",
                "title": "Developer",
                "city": "New York"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["last_name"] == "Doe"
        assert data["employee_id"] is not None
    
    def test_create_employee_as_employee(self, client: TestClient, auth_token: str):
        response = client.post(
            "/api/v1/employees",
            json={"last_name": "Should Fail", "first_name": "Fail"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 403
    
    def test_get_single_employee(self, client: TestClient, admin_token: str):
        # Create
        create_response = client.post(
            "/api/v1/employees",
            json={"last_name": "Smith", "first_name": "Jane"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        employee_id = create_response.json()["employee_id"]
        
        # Get
        response = client.get(
            f"/api/v1/employees/{employee_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["employee_id"] == employee_id
    
    def test_update_employee(self, client: TestClient, admin_token: str):
        # Create
        create_response = client.post(
            "/api/v1/employees",
            json={"last_name": "Update", "first_name": "Test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        employee_id = create_response.json()["employee_id"]
        
        # Update
        response = client.put(
            f"/api/v1/employees/{employee_id}",
            json={"last_name": "Updated Last Name"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["last_name"] == "Updated Last Name"
    
    def test_delete_employee(self, client: TestClient, admin_token: str):
        # Create
        create_response = client.post(
            "/api/v1/employees",
            json={"last_name": "Delete", "first_name": "Test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        employee_id = create_response.json()["employee_id"]
        
        # Delete
        response = client.delete(
            f"/api/v1/employees/{employee_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        # Verify it's gone from list (soft deleted)
        get_response = client.get(
            f"/api/v1/employees/{employee_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert get_response.status_code == 404

    def test_get_titles(self, client: TestClient, auth_token: str):
        response = client.get(
            "/api/v1/employees/filters/titles",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_employee_relationships(self, client: TestClient, admin_token: str):
        # Create Manager
        manager_res = client.post(
            "/api/v1/employees",
            json={"last_name": "Boss", "first_name": "Big", "title": "CEO"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        manager_id = manager_res.json()["employee_id"]

        # Create Report
        report_res = client.post(
            "/api/v1/employees",
            json={"last_name": "Worker", "first_name": "Little", "reports_to": manager_id},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert report_res.status_code == 201
        report_data = report_res.json()
        assert report_data["reports_to"] == manager_id
        assert "reports_to_name" in report_data
        
        report_id = report_data["employee_id"]

        # Test self-reference validation on update
        update_res = client.put(
            f"/api/v1/employees/{manager_id}",
            json={"reports_to": manager_id},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert update_res.status_code == 409 # Conflict

        # Test delete manager with reports
        delete_res = client.delete(
            f"/api/v1/employees/{manager_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_res.status_code == 409 # Conflict
