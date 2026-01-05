from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.utils.password import hash_password
from app.utils.exceptions import NotFoundError, ConflictError

class UserService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, user_id: UUID) -> Optional[User]:
        return self.db.query(User).filter(User.user_id == user_id).first()
    
    def get_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username.lower()).first()
    
    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email.lower()).first()
    
    def create(self, user_data: UserCreate, created_by: Optional[UUID] = None) -> User:
        # Check for existing username
        if self.get_by_username(user_data.username):
            raise ConflictError("Username already exists")
        
        # Check for existing email
        if self.get_by_email(user_data.email):
            raise ConflictError("Email already exists")
        
        user = User(
            username=user_data.username.lower(),
            email=user_data.email.lower(),
            password_hash=hash_password(user_data.password),
            role=user_data.role,
            created_by=created_by
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def update(self, user_id: UUID, user_data: UserUpdate) -> User:
        user = self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        update_data = user_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def delete(self, user_id: UUID) -> bool:
        user = self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        user.is_active = False
        self.db.commit()
        return True
