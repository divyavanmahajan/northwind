from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from uuid import UUID
from typing import Optional, Tuple, List
from app.models.user import User, UserRole
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
    
    def get_list(
        self,
        page: int = 1,
        page_size: int = 25,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[User], int]:
        """Get paginated list of users with filtering."""
        query = self.db.query(User)
        
        # Apply filters
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    func.lower(User.username).like(search_term),
                    func.lower(User.email).like(search_term)
                )
            )
        
        if role:
            query = query.filter(User.role == role)
        
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        # Get total count
        total = query.count()
        
        # Apply sorting
        if hasattr(User, sort_by):
            order_column = getattr(User, sort_by)
            if sort_order == "desc":
                query = query.order_by(order_column.desc())
            else:
                query = query.order_by(order_column.asc())
        
        # Apply pagination
        offset = (page - 1) * page_size
        users = query.offset(offset).limit(page_size).all()
        
        return users, total
    
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
    
    def set_active(self, user_id: UUID, is_active: bool) -> User:
        """Activate or deactivate a user."""
        user = self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        user.is_active = is_active
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def reset_password(self, user_id: UUID, new_password: str) -> User:
        """Reset user password (admin function)."""
        user = self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        user.password_hash = hash_password(new_password)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def delete(self, user_id: UUID) -> bool:
        user = self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        self.db.delete(user)
        self.db.commit()
        return True
