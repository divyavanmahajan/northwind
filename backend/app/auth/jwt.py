from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from uuid import UUID
from app.config import settings
from app.models.user import UserRole

class TokenData:
    def __init__(self, user_id: UUID, username: str, role: UserRole, exp: datetime):
        self.user_id = user_id
        self.username = username
        self.role = role
        self.exp = exp

def create_access_token(
    user_id: UUID,
    username: str,
    role: UserRole,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(seconds=settings.JWT_EXPIRATION)
    
    payload = {
        "sub": str(user_id),
        "username": username,
        "role": role.value,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    }
    
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> Optional[TokenData]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        user_id = UUID(payload.get("sub"))
        username = payload.get("username")
        role = UserRole(payload.get("role"))
        exp = datetime.fromtimestamp(payload.get("exp"), tz=timezone.utc)
        
        return TokenData(user_id, username, role, exp)
    except (JWTError, ValueError, KeyError):
        return None

def is_token_expired(token_data: TokenData) -> bool:
    """Check if token is expired."""
    return datetime.now(timezone.utc) > token_data.exp
