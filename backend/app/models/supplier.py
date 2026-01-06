from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin

class Supplier(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "suppliers"
    
    supplier_id = Column(Integer, primary_key=True, autoincrement=True)
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
    homepage = Column(Text, nullable=True)
    
    # Relationships
    products = relationship("Product", back_populates="supplier", lazy="dynamic")
    
    def __repr__(self):
        return f"<Supplier {self.company_name}>"
