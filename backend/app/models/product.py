from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin, SoftDeleteMixin

class Product(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "products"
    
    product_id = Column(Integer, primary_key=True, autoincrement=True)
    product_name = Column(String(100), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.category_id"), nullable=True)
    quantity_per_unit = Column(String(50), nullable=True)
    unit_price = Column(Numeric(10, 2), nullable=True, default=0)
    units_in_stock = Column(Integer, nullable=True, default=0)
    units_on_order = Column(Integer, nullable=True, default=0)
    reorder_level = Column(Integer, nullable=True, default=0)
    discontinued = Column(Boolean, nullable=False, default=False)
    
    # Relationships
    category = relationship("Category", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")
    order_details = relationship("OrderDetail", back_populates="product", lazy="dynamic")
    
    @property
    def stock_status(self) -> str:
        if self.discontinued:
            return "discontinued"
        if self.units_in_stock == 0:
            return "out_of_stock"
        if (self.units_in_stock or 0) <= (self.reorder_level or 0):
            return "low_stock"
        return "in_stock"
    
    def __repr__(self):
        return f"<Product {self.product_name}>"
