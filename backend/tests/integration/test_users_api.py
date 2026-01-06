import pytest
from fastapi.testclient import TestClient
from app.models.user import UserRole
from app.services.user_service import UserService
from app.schemas.user import UserCreate

class TestUsersApi:
    @pytest.fixture(autouse=True)
    def setup(self, db_session):
        service = UserService(db_session)
        # Clean up all potential test users
        test_usernames = [
            "api_test_user", "update_me", "updated_user", 
            "toggle_me", "reset_pass", "delete_me"
        ]
        for username in test_usernames:
            user = service.get_by_username(username)
            if user:
                db_session.delete(user)
        db_session.commit()
    def test_list_users_admin_only(self, client: TestClient, admin_token, auth_token):
        # Admin can list users
        response = client.get(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data
        assert len(data["data"]) > 0

        # Regular user (Employee) cannot list users
        response = client.get(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 403

    def test_create_user(self, client: TestClient, admin_token):
        payload = {
            "username": "api_test_user",
            "email": "api_test@example.com",
            "password": "ValidPass123!",
            "role": UserRole.EMPLOYEE
        }
        response = client.post(
            "/api/v1/users",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "api_test_user"
        assert data["email"] == "api_test@example.com"
        assert "password" not in data

    def test_update_user(self, client: TestClient, admin_token, db_session):
        # Create a user to update
        service = UserService(db_session)
        user = service.create(UserCreate(
            username="update_me",
            email="update_me@example.com",
            password="ValidPass123!",
            role=UserRole.EMPLOYEE
        ))

        payload = {
            "username": "updated_user",
            "email": "updated@example.com",
            "role": UserRole.MANAGER,
            "is_active": True
        }
        response = client.put(
            f"/api/v1/users/{user.user_id}",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "updated_user"
        assert data["role"] == UserRole.MANAGER

    def test_toggle_user_active_status(self, client: TestClient, admin_token, db_session):
        # Create a user
        service = UserService(db_session)
        user = service.create(UserCreate(
            username="toggle_me",
            email="toggle@example.com",
            password="ValidPass123!",
            role=UserRole.EMPLOYEE
        ))

        # Deactivate
        response = client.patch(
            f"/api/v1/users/{user.user_id}/deactivate",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        db_session.refresh(user)
        assert user.is_active is False

        # Activate
        response = client.patch(
            f"/api/v1/users/{user.user_id}/activate",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        db_session.refresh(user)
        assert user.is_active is True

    def test_reset_password(self, client: TestClient, admin_token, db_session):
        # Create a user
        service = UserService(db_session)
        user = service.create(UserCreate(
            username="reset_pass",
            email="reset@example.com",
            password="OldPass123!",
            role=UserRole.EMPLOYEE
        ))

        payload = {"new_password": "NewSecretPass123!"}
        response = client.patch(
            f"/api/v1/users/{user.user_id}/reset-password",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200

        # Verify login with new password
        login_response = client.post(
            "/api/v1/auth/login",
            json={"username": "reset_pass", "password": "NewSecretPass123!"}
        )
        assert login_response.status_code == 200

    def test_delete_user(self, client: TestClient, admin_token, db_session):
        # Create a user
        service = UserService(db_session)
        user = service.create(UserCreate(
            username="delete_me",
            email="delete@example.com",
            password="ValidPass123!",
            role=UserRole.EMPLOYEE
        ))

        response = client.delete(
            f"/api/v1/users/{user.user_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200

        # Verify user is gone
        found = service.get_by_id(user.user_id)
        assert found is None

    def test_cannot_deactivate_self(self, client: TestClient, admin_token, db_session):
        # Find current admin user
        service = UserService(db_session)
        admin = service.get_by_username("testadmin")
        
        response = client.patch(
            f"/api/v1/users/{admin.user_id}/deactivate",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400
        assert "Cannot deactivate your own account" in response.json()["error"]["message"]

    def test_cannot_delete_self(self, client: TestClient, admin_token, db_session):
        # Find current admin user
        service = UserService(db_session)
        admin = service.get_by_username("testadmin")
        
        response = client.delete(
            f"/api/v1/users/{admin.user_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400
        assert "Cannot delete your own account" in response.json()["error"]["message"]
