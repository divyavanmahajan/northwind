import sys
import os
# Add the app directory to the path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal
from app.services.user_service import UserService
from app.schemas.user import UserCreate
from app.models.user import UserRole

def create_test_users():
    db = SessionLocal()
    try:
        service = UserService(db)
        
        # Create Manager
        if not service.get_by_username("manager"):
            manager = UserCreate(
                username="manager",
                email="manager@example.com",
                password="Manager123!",
                role=UserRole.MANAGER
            )
            user = service.create(manager)
            print(f"Created manager user: {user.username}")
        else:
            print("Manager user already exists")

        # Create Customer
        if not service.get_by_username("customer"):
            customer = UserCreate(
                username="customer",
                email="customer@example.com",
                password="Customer123!",
                role=UserRole.CUSTOMER
            )
            user = service.create(customer)
            print(f"Created customer user: {user.username}")
        else:
            print("Customer user already exists")

    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()
