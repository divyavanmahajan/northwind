from pydantic import BaseModel, EmailStr, field_validator, ConfigDict, Field
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.user import UserRole

# Base schema with common fields
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: UserRole = UserRole.EMPLOYEE

# Schema for creating users
class UserCreate(UserBase):
    password: str
    
    @field_validator('username')
    @classmethod
    def username_valid(cls, v: str) -> str:
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if len(v) > 50:
            raise ValueError('Username must be at most 50 characters')
        if not v.isalnum() and '_' not in v:
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v.lower()
    
    @field_validator('password')
    @classmethod
    def password_valid(cls, v: str) -> str:
        from app.utils.password import PasswordValidator
        is_valid, errors = PasswordValidator.validate(v)
        if not is_valid:
            raise ValueError('; '.join(errors))
        return v

# Schema for updating users (all fields optional)
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

# Schema for password change
class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def password_valid(cls, v: str) -> str:
        from app.utils.password import PasswordValidator
        is_valid, errors = PasswordValidator.validate(v)
        if not is_valid:
            raise ValueError('; '.join(errors))
        return v

# Schema for responses (no password)
class UserResponse(UserBase):
    user_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

# Schema for user in token
class UserInToken(BaseModel):
    user_id: UUID
    username: str
    role: UserRole

# Schema for user list (lighter response)
class UserListResponse(BaseModel):
    user_id: UUID
    username: str
    email: str
    role: UserRole
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Schema for password reset (admin)
class PasswordReset(BaseModel):
    new_password: str = Field(..., min_length=8)
    
    @field_validator('new_password')
    @classmethod
    def password_valid(cls, v: str) -> str:
        from app.utils.password import PasswordValidator
        is_valid, errors = PasswordValidator.validate(v)
        if not is_valid:
            raise ValueError('; '.join(errors))
        return v
