import pytest
from datetime import timedelta
from app.auth.jwt import create_access_token, decode_token, is_token_expired
from app.models.user import UserRole
from uuid import uuid4

class TestJWT:
    def test_create_access_token(self):
        user_id = uuid4()
        token = create_access_token(user_id, "testuser", UserRole.ADMIN)
        assert token is not None
        assert len(token) > 0
    
    def test_decode_token_valid(self):
        user_id = uuid4()
        token = create_access_token(user_id, "testuser", UserRole.MANAGER)
        data = decode_token(token)
        assert data is not None
        assert data.user_id == user_id
        assert data.username == "testuser"
        assert data.role == UserRole.MANAGER
    
    def test_decode_token_invalid(self):
        data = decode_token("invalid.token.here")
        assert data is None
    
    def test_decode_token_expired(self):
        user_id = uuid4()
        token = create_access_token(
            user_id, "testuser", UserRole.EMPLOYEE,
            expires_delta=timedelta(seconds=-1)  # Already expired
        )
        data = decode_token(token)
        # Jose will reject expired tokens
        assert data is None
