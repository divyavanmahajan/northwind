from sqlalchemy import Column, Integer, String, Text, LargeBinary
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin

class Category(Base, TimestampMixin):
    __tablename__ = "categories"
    
    category_id = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    picture = Column(LargeBinary, nullable=True)  # Store as binary, rarely used
    
    # Relationships
    products = relationship("Product", back_populates="category", lazy="dynamic")
    
    def __repr__(self):
        return f"<Category {self.category_name}>"
