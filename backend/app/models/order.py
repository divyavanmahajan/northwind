from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin
import enum
from decimal import Decimal

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class Order(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "orders"
    
    order_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(String(5), ForeignKey("customers.customer_id"), nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    order_date = Column(Date, nullable=True, index=True)
    required_date = Column(Date, nullable=True)
    shipped_date = Column(Date, nullable=True)
    ship_via = Column(Integer, ForeignKey("shippers.shipper_id"), nullable=True)
    freight = Column(Numeric(10, 2), nullable=True, default=0)
    ship_name = Column(String(100), nullable=True)
    ship_address = Column(String(200), nullable=True)
    ship_city = Column(String(50), nullable=True)
    ship_region = Column(String(50), nullable=True)
    ship_postal_code = Column(String(20), nullable=True)
    ship_country = Column(String(50), nullable=True)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    
    # Relationships
    customer = relationship("Customer", back_populates="orders")
    employee = relationship("Employee", back_populates="orders")
    shipper = relationship("Shipper", back_populates="orders")
    order_details = relationship("OrderDetail", back_populates="order", cascade="all, delete-orphan")
    
    @property
    def subtotal(self) -> Decimal:
        return sum((d.line_total for d in self.order_details), Decimal(0))
    
    @property
    def discount_total(self) -> Decimal:
        return sum((d.discount_amount for d in self.order_details), Decimal(0))
    
    @property
    def total(self) -> Decimal:
        freight_val = self.freight or 0
        return self.subtotal - self.discount_total + Decimal(str(freight_val))
    
    def __repr__(self):
        return f"<Order {self.order_id}>"
