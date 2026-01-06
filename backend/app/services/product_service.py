from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import Optional, List, Tuple
from decimal import Decimal
from app.models.product import Product
from app.models.category import Category
from app.models.supplier import Supplier
from app.schemas.product import ProductCreate, ProductUpdate
from app.utils.exceptions import NotFoundError, ConflictError
from datetime import datetime

class ProductService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, product_id: int) -> Optional[Product]:
        return self.db.query(Product).options(
            joinedload(Product.category),
            joinedload(Product.supplier)
        ).filter(
            Product.product_id == product_id,
            Product.deleted_at.is_(None)
        ).first()
    
    def get_list(
        self,
        page: int = 1,
        page_size: int = 25,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        supplier_id: Optional[int] = None,
        stock_status: Optional[str] = None,  # in_stock, low_stock, out_of_stock, discontinued
        price_min: Optional[Decimal] = None,
        price_max: Optional[Decimal] = None,
        discontinued: Optional[bool] = None,
        sort_by: str = "product_name",
        sort_order: str = "asc"
    ) -> Tuple[List[Product], int]:
        query = self.db.query(Product).options(
            joinedload(Product.category),
            joinedload(Product.supplier)
        ).filter(Product.deleted_at.is_(None))
        
        # Search across product, category, and supplier names
        if search:
            search_filter = f"%{search}%"
            query = query.outerjoin(Product.category).outerjoin(Product.supplier).filter(
                or_(
                    Product.product_name.ilike(search_filter),
                    Category.category_name.ilike(search_filter),
                    Supplier.company_name.ilike(search_filter)
                )
            )
        
        # Filters
        if category_id:
            query = query.filter(Product.category_id == category_id)
        if supplier_id:
            query = query.filter(Product.supplier_id == supplier_id)
        if discontinued is not None:
            query = query.filter(Product.discontinued == discontinued)
        if price_min is not None:
            query = query.filter(Product.unit_price >= price_min)
        if price_max is not None:
            query = query.filter(Product.unit_price <= price_max)
        
        # Stock status filter
        if stock_status:
            if stock_status == "discontinued":
                query = query.filter(Product.discontinued == True)
            elif stock_status == "out_of_stock":
                query = query.filter(Product.units_in_stock == 0, Product.discontinued == False)
            elif stock_status == "low_stock":
                query = query.filter(
                    Product.units_in_stock > 0,
                    Product.units_in_stock <= Product.reorder_level,
                    Product.discontinued == False
                )
            elif stock_status == "in_stock":
                query = query.filter(
                    Product.units_in_stock > Product.reorder_level,
                    Product.discontinued == False
                )
        
        total = query.count()
        
        # Sorting with relationship handling
        if sort_by == "category_name":
            query = query.outerjoin(Product.category)
            sort_column = Category.category_name
        elif sort_by == "supplier_name":
            query = query.outerjoin(Product.supplier)
            sort_column = Supplier.company_name
        else:
            sort_column = getattr(Product, sort_by, Product.product_name)
        
        if sort_order.lower() == "desc":
            sort_column = sort_column.desc()
        query = query.order_by(sort_column)
        
        offset = (page - 1) * page_size
        products = query.offset(offset).limit(page_size).all()
        
        return products, total
    
    def create(self, data: ProductCreate) -> Product:
        # Validate category exists
        if data.category_id:
            category = self.db.query(Category).filter(
                Category.category_id == data.category_id
            ).first()
            if not category:
                raise NotFoundError(f"Category {data.category_id} not found")
        
        # Validate supplier exists
        if data.supplier_id:
            supplier = self.db.query(Supplier).filter(
                Supplier.supplier_id == data.supplier_id,
                Supplier.deleted_at.is_(None)
            ).first()
            if not supplier:
                raise NotFoundError(f"Supplier {data.supplier_id} not found")
        
        product = Product(**data.model_dump())
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return self.get_by_id(product.product_id)
    
    def update(self, product_id: int, data: ProductUpdate) -> Product:
        product = self.get_by_id(product_id)
        if not product:
            raise NotFoundError(f"Product {product_id} not found")
        
        update_data = data.model_dump(exclude_unset=True)
        
        # Validate relationships if changing
        if "category_id" in update_data and update_data["category_id"]:
            category = self.db.query(Category).filter(
                Category.category_id == update_data["category_id"]
            ).first()
            if not category:
                raise NotFoundError(f"Category {update_data['category_id']} not found")
        
        if "supplier_id" in update_data and update_data["supplier_id"]:
            supplier = self.db.query(Supplier).filter(
                Supplier.supplier_id == update_data["supplier_id"],
                Supplier.deleted_at.is_(None)
            ).first()
            if not supplier:
                raise NotFoundError(f"Supplier {update_data['supplier_id']} not found")
        
        for field, value in update_data.items():
            setattr(product, field, value)
        
        self.db.commit()
        self.db.refresh(product)
        return self.get_by_id(product_id)
    
    def delete(self, product_id: int) -> bool:
        product = self.get_by_id(product_id)
        if not product:
            raise NotFoundError(f"Product {product_id} not found")
        
        product.deleted_at = datetime.utcnow()
        self.db.commit()
        return True
    
    def discontinue(self, product_id: int) -> Product:
        product = self.get_by_id(product_id)
        if not product:
            raise NotFoundError(f"Product {product_id} not found")
        
        product.discontinued = True
        self.db.commit()
        self.db.refresh(product)
        return product

    def get_price_range(self) -> Tuple[Decimal, Decimal]:
        from sqlalchemy import func
        result = self.db.query(
            func.min(Product.unit_price),
            func.max(Product.unit_price)
        ).filter(Product.deleted_at.is_(None)).first()
        
        return (result[0] or Decimal('0'), result[1] or Decimal('0'))
