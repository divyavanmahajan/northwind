from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional
from app.models.user import User
from app.services.user_service import UserService
from app.utils.password import verify_password
from app.utils.exceptions import AuthenticationError
from app.auth.jwt import create_access_token
from app.config import settings

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_service = UserService(db)
    
    def authenticate(self, username: str, password: str) -> User:
        """Authenticate user with username and password."""
        user = self.user_service.get_by_username(username)
        
        if not user:
            # Use constant-time comparison to prevent timing attacks
            verify_password(password, "$2b$12$jr5.1.ZoFVDm0xX9dgM9.OJtgogdb/VAP06N9krC6QMKSmTdqEdl2")
            raise AuthenticationError("Invalid username or password")
        
        if not verify_password(password, user.password_hash):
            raise AuthenticationError("Invalid username or password")
        
        if not user.is_active:
            raise AuthenticationError("Account is deactivated")
        
        # Update last login
        user.last_login = datetime.now(timezone.utc)
        self.db.commit()
        
        return user
    
    def create_tokens(self, user: User) -> dict:
        """Create access token for user."""
        access_token = create_access_token(
            user_id=user.user_id,
            username=user.username,
            role=user.role
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.JWT_EXPIRATION
        }
    
    def login(self, username: str, password: str) -> tuple[User, dict]:
        """Full login flow: authenticate and create tokens."""
        user = self.authenticate(username, password)
        tokens = self.create_tokens(user)
        return user, tokens
