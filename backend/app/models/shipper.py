from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Shipper(Base):
    __tablename__ = "shippers"
    
    shipper_id = Column(Integer, primary_key=True, autoincrement=True)
    company_name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=True)
    
    orders = relationship("Order", back_populates="shipper", lazy="dynamic")
    
    def __repr__(self):
        return f"<Shipper {self.company_name}>"
