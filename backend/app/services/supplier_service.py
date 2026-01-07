from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List, Tuple
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate
from app.utils.exceptions import NotFoundError, ConflictError
from datetime import datetime

class SupplierService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, supplier_id: int) -> Optional[Supplier]:
        return self.db.query(Supplier).filter(
            Supplier.supplier_id == supplier_id,
            Supplier.deleted_at.is_(None)
        ).first()
    
    def get_list(
        self,
        page: int = 1,
        page_size: int = 25,
        search: Optional[str] = None,
        country: Optional[str] = None,
        city: Optional[str] = None,
        sort_by: str = "company_name",
        sort_order: str = "asc"
    ) -> Tuple[List[Supplier], int]:
        query = self.db.query(Supplier).filter(Supplier.deleted_at.is_(None))
        
        # Search across multiple fields
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Supplier.company_name.ilike(search_filter),
                    Supplier.contact_name.ilike(search_filter),
                    Supplier.city.ilike(search_filter),
                    Supplier.country.ilike(search_filter)
                )
            )
        
        # Filters
        if country:
            query = query.filter(Supplier.country == country)
        if city:
            query = query.filter(Supplier.city == city)
        
        total = query.count()
        
        # Sorting
        sort_column = getattr(Supplier, sort_by, Supplier.company_name)
        if sort_order.lower() == "desc":
            sort_column = sort_column.desc()
        query = query.order_by(sort_column)
        
        # Pagination
        offset = (page - 1) * page_size
        suppliers = query.offset(offset).limit(page_size).all()
        
        return suppliers, total
    
    def get_countries(self) -> List[str]:
        """Get distinct countries for filter dropdown."""
        result = self.db.query(Supplier.country).filter(
            Supplier.country.isnot(None),
            Supplier.deleted_at.is_(None)
        ).distinct().order_by(Supplier.country).all()
        return [r[0] for r in result]
    
    def get_cities(self, country: Optional[str] = None) -> List[str]:
        """Get distinct cities for filter dropdown."""
        query = self.db.query(Supplier.city).filter(
            Supplier.city.isnot(None),
            Supplier.deleted_at.is_(None)
        )
        if country:
            query = query.filter(Supplier.country == country)
        result = query.distinct().order_by(Supplier.city).all()
        return [r[0] for r in result]
    
    def create(self, data: SupplierCreate) -> Supplier:
        supplier = Supplier(**data.model_dump())
        self.db.add(supplier)
        self.db.commit()
        self.db.refresh(supplier)
        return supplier
    
    def update(self, supplier_id: int, data: SupplierUpdate) -> Supplier:
        supplier = self.get_by_id(supplier_id)
        if not supplier:
            raise NotFoundError(f"Supplier with ID {supplier_id} not found")
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(supplier, field, value)
        
        self.db.commit()
        self.db.refresh(supplier)
        return supplier
    
    def delete(self, supplier_id: int) -> bool:
        """Soft delete supplier."""
        supplier = self.get_by_id(supplier_id)
        if not supplier:
            raise NotFoundError(f"Supplier with ID {supplier_id} not found")
        
        # Check for products
        try:
            product_count = supplier.products.count()
            if product_count > 0:
                raise ConflictError(
                    f"Cannot delete supplier with {product_count} products. "
                    "Reassign products first."
                )
        except Exception:
            # Handle case where Product model is not yet available
            pass
        
        supplier.deleted_at = datetime.utcnow()
        self.db.commit()
        return True
    
    def get_product_count(self, supplier_id: int) -> int:
        supplier = self.get_by_id(supplier_id)
        if not supplier:
            return 0
        try:
            return supplier.products.filter_by(deleted_at=None).count()
        except Exception:
            # Handle case where Product model is not yet available
            return 0

    def get_products(self, supplier_id: int) -> List[any]:
        supplier = self.get_by_id(supplier_id)
        if not supplier:
            return []
        try:
            return supplier.products.filter_by(deleted_at=None).all()
        except Exception:
            return []
