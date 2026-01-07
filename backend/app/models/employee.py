from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin

class Employee(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "employees"
    
    employee_id = Column(Integer, primary_key=True, autoincrement=True)
    last_name = Column(String(20), nullable=False, index=True)
    first_name = Column(String(10), nullable=False)
    title = Column(String(30), nullable=True)
    title_of_courtesy = Column(String(25), nullable=True)
    birth_date = Column(DateTime, nullable=True)
    hire_date = Column(DateTime, nullable=True)
    address = Column(String(60), nullable=True)
    city = Column(String(15), nullable=True, index=True)
    region = Column(String(15), nullable=True)
    postal_code = Column(String(10), nullable=True)
    country = Column(String(15), nullable=True, index=True)
    home_phone = Column(String(24), nullable=True)
    extension = Column(String(4), nullable=True)
    notes = Column(Text, nullable=True)
    reports_to = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    photo_path = Column(String(255), nullable=True)
    
    # Relationships
    manager = relationship("Employee", remote_side=[employee_id], back_populates="reports")
    reports = relationship("Employee", back_populates="manager", lazy="dynamic")
    orders = relationship("Order", back_populates="employee", lazy="dynamic")
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<Employee {self.full_name}>"
