from sqlalchemy import Column, Integer, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from decimal import Decimal

class OrderDetail(Base):
    __tablename__ = "order_details"
    
    order_id = Column(Integer, ForeignKey("orders.order_id"), primary_key=True)
    product_id = Column(Integer, ForeignKey("products.product_id"), primary_key=True)
    unit_price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    discount = Column(Numeric(4, 2), nullable=False, default=0)  # Stored as decimal (0.15 = 15%)
    
    # Relationships
    order = relationship("Order", back_populates="order_details")
    product = relationship("Product", back_populates="order_details")
    
    @property
    def product_name(self) -> str:
        return self.product.product_name if self.product else "Unknown Product"
    
    @property
    def line_total(self) -> Decimal:
        return Decimal(str(self.unit_price)) * self.quantity
    
    @property
    def discount_amount(self) -> Decimal:
        return self.line_total * Decimal(str(self.discount))
    
    @property
    def final_total(self) -> Decimal:
        return self.line_total - self.discount_amount
