from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin

class Customer(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "customers"
    
    customer_id = Column(String(5), primary_key=True)  # Northwind uses 5-char IDs
    company_name = Column(String(100), nullable=False, index=True)
    contact_name = Column(String(100), nullable=True)
    contact_title = Column(String(50), nullable=True)
    address = Column(String(200), nullable=True)
    city = Column(String(50), nullable=True, index=True)
    region = Column(String(50), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(50), nullable=True, index=True)
    phone = Column(String(30), nullable=True)
    fax = Column(String(30), nullable=True)
    
    # Link to user account (optional - for customer login)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True, unique=True)
    
    # Relationships
    user = relationship("User", backref="customer_profile")
    # Using string reference for Order
    orders = relationship("Order", back_populates="customer", lazy="dynamic")
    
    def __repr__(self):
        return f"<Customer {self.company_name}>"
