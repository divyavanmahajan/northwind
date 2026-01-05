"""Script to create initial admin user."""
import sys
import os
# Add the app directory to the path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal
from app.services.user_service import UserService
from app.schemas.user import UserCreate
from app.models.user import UserRole

def create_admin():
    db = SessionLocal()
    try:
        service = UserService(db)
        
        # Check if admin exists
        if service.get_by_username("admin"):
            print("Admin user already exists")
            return
        
        admin = UserCreate(
            username="admin",
            email="admin@northwind.com",
            password="Admin123!",
            role=UserRole.ADMIN
        )
        
        user = service.create(admin)
        print(f"Created admin user: {user.username} ({user.user_id})")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
