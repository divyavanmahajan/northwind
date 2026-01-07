from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List, Tuple
from datetime import datetime
from decimal import Decimal

from app.models.customer import Customer
from app.models.user import User, UserRole
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerStatistics
from app.utils.exceptions import NotFoundError, ConflictError

class CustomerService:
    def __init__(self, db: Session, current_user: Optional[User] = None):
        self.db = db
        self.current_user = current_user
    
    def _apply_access_filter(self, query):
        """Apply data isolation for customer role."""
        if self.current_user and self.current_user.role == UserRole.CUSTOMER:
            # Customers can only see their own data
            customer = self.db.query(Customer).filter(
                Customer.user_id == self.current_user.user_id
            ).first()
            if customer:
                query = query.filter(Customer.customer_id == customer.customer_id)
            else:
                # No linked customer - return empty
                query = query.filter(False)
        return query
    
    def get_by_id(self, customer_id: str) -> Optional[Customer]:
        query = self.db.query(Customer).filter(
            Customer.customer_id == customer_id,
            Customer.deleted_at.is_(None)
        )
        query = self._apply_access_filter(query)
        return query.first()
        
    def get_list(
        self,
        page: int = 1,
        page_size: int = 25,
        search: Optional[str] = None,
        country: Optional[str] = None,
        city: Optional[str] = None,
        sort_by: str = "company_name",
        sort_order: str = "asc"
    ) -> Tuple[List[Customer], int]:
        query = self.db.query(Customer).filter(Customer.deleted_at.is_(None))
        query = self._apply_access_filter(query)
        
        # Search across multiple fields
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Customer.company_name.ilike(search_filter),
                    Customer.contact_name.ilike(search_filter),
                    Customer.customer_id.ilike(search_filter),
                    Customer.city.ilike(search_filter),
                    Customer.country.ilike(search_filter)
                )
            )
        
        # Filters
        if country:
            query = query.filter(Customer.country == country)
        if city:
            query = query.filter(Customer.city == city)
        
        total = query.count()
        
        # Sorting
        sort_column = getattr(Customer, sort_by, Customer.company_name)
        if sort_order.lower() == "desc":
            sort_column = sort_column.desc()
        query = query.order_by(sort_column)
        
        # Pagination
        offset = (page - 1) * page_size
        customers = query.offset(offset).limit(page_size).all()
        
        return customers, total

    def get_countries(self) -> List[str]:
        """Get distinct countries for filter dropdown."""
        query = self.db.query(Customer.country).filter(
            Customer.country.isnot(None),
            Customer.deleted_at.is_(None)
        )
        query = self._apply_access_filter(query)
        result = query.distinct().order_by(Customer.country).all()
        return [r[0] for r in result]
    
    def get_cities(self, country: Optional[str] = None) -> List[str]:
        """Get distinct cities for filter dropdown."""
        query = self.db.query(Customer.city).filter(
            Customer.city.isnot(None),
            Customer.deleted_at.is_(None)
        )
        if country:
            query = query.filter(Customer.country == country)
        
        query = self._apply_access_filter(query)
        result = query.distinct().order_by(Customer.city).all()
        return [r[0] for r in result]

    def create(self, data: CustomerCreate) -> Customer:
        # Check if ID already exists
        existing = self.db.query(Customer).filter(
            Customer.customer_id == data.customer_id
        ).first()
        if existing:
            raise ConflictError(f"Customer with ID {data.customer_id} already exists")

        # Check if user_id is already linked
        if data.user_id:
            existing_auth = self.db.query(Customer).filter(
                Customer.user_id == data.user_id,
                Customer.deleted_at.is_(None)
            ).first()
            if existing_auth:
                raise ConflictError(f"User is already linked to another customer")

        customer = Customer(**data.model_dump())
        self.db.add(customer)
        self.db.commit()
        self.db.refresh(customer)
        return customer
    
    def update(self, customer_id: str, data: CustomerUpdate) -> Customer:
        customer = self.get_by_id(customer_id)
        if not customer:
            raise NotFoundError(f"Customer with ID {customer_id} not found")
        
        update_data = data.model_dump(exclude_unset=True)
        
        # Check if user_id is being updated and is already linked
        if 'user_id' in update_data and update_data['user_id']:
            existing_auth = self.db.query(Customer).filter(
                Customer.user_id == update_data['user_id'],
                Customer.customer_id != customer_id,
                Customer.deleted_at.is_(None)
            ).first()
            if existing_auth:
                raise ConflictError(f"User is already linked to another customer")

        for field, value in update_data.items():
            setattr(customer, field, value)
        
        self.db.commit()
        self.db.refresh(customer)
        return customer
    
    def delete(self, customer_id: str) -> bool:
        """Soft delete customer."""
        customer = self.get_by_id(customer_id)
        if not customer:
            raise NotFoundError(f"Customer with ID {customer_id} not found")
        
        # Check for orders (commented out for now as Order model pending)
        # if customer.orders.filter_by(deleted_at=None).count() > 0:
        #    raise ConflictError("Cannot delete customer with active orders")
        
        customer.deleted_at = datetime.utcnow()
        self.db.commit()
        return True

    def get_statistics(self, customer_id: str) -> CustomerStatistics:
        """Calculate customer order statistics."""
        from app.models.order import Order
        
        # Get orders for this customer
        query = self.db.query(Order).filter(
            Order.customer_id == customer_id,
            Order.deleted_at.is_(None)
        )
        
        orders = query.all()
        total_orders = len(orders)
        
        if total_orders == 0:
            return CustomerStatistics(
                total_orders=0,
                total_spent=Decimal(0),
                average_order_value=Decimal(0),
                first_order_date=None,
                last_order_date=None
            )
            
        total_spent = sum((o.total for o in orders), Decimal(0))
        avg_value = total_spent / total_orders
        
        first_order = min((o.order_date for o in orders if o.order_date), default=None)
        last_order = max((o.order_date for o in orders if o.order_date), default=None)

        return CustomerStatistics(
            total_orders=total_orders,
            total_spent=total_spent,
            average_order_value=avg_value,
            first_order_date=first_order,
            last_order_date=last_order
        )
    
    def get_for_current_user(self) -> Optional[Customer]:
        """Get customer profile for currently logged in customer user."""
        if not self.current_user:
            return None
        return self.db.query(Customer).filter(
            Customer.user_id == self.current_user.user_id,
            Customer.deleted_at.is_(None)
        ).first()

    def get_order_count(self, customer_id: str) -> int:
        """Get number of orders for a customer."""
        from app.models.order import Order
        return self.db.query(Order).filter(
            Order.customer_id == customer_id,
            Order.deleted_at.is_(None)
        ).count()

    def get_orders(
        self,
        customer_id: str,
        page: int = 1,
        page_size: int = 10,
        status: Optional[str] = None
    ) -> Tuple[List[any], int]:
        """Get orders for a customer with pagination."""
        from app.models.order import Order
        
        query = self.db.query(Order).filter(
            Order.customer_id == customer_id,
            Order.deleted_at.is_(None)
        )
        
        if status:
            query = query.filter(Order.status == status)
            
        total = query.count()
        
        offset = (page - 1) * page_size
        orders = query.order_by(Order.order_date.desc()).offset(offset).limit(page_size).all()
        
        return orders, total
