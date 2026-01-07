from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List, Tuple
from datetime import date, datetime
from app.models.order import Order, OrderStatus
from app.models.order_detail import OrderDetail
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderUpdate
from app.utils.exceptions import NotFoundError, ValidationError

class OrderService:
    def __init__(self, db: Session, current_user: Optional[User] = None):
        self.db = db
        self.current_user = current_user
    
    def _apply_access_filter(self, query):
        """Customer role can only see their own orders."""
        if self.current_user and self.current_user.role == UserRole.CUSTOMER:
            customer = self.db.query(Customer).filter(
                Customer.user_id == self.current_user.user_id
            ).first()
            if customer:
                query = query.filter(Order.customer_id == customer.customer_id)
            else:
                # Optimized empty query
                query = query.filter(Order.order_id == -1) 
        return query
    
    def get_list(
        self, 
        page: int = 1, 
        page_size: int = 25,
        status: Optional[OrderStatus] = None,
        customer_id: Optional[str] = None
    ) -> Tuple[List[Order], int]:
        query = self.db.query(Order).filter(Order.deleted_at.is_(None))
        query = self._apply_access_filter(query)
        
        if status:
            query = query.filter(Order.status == status)
        if customer_id:
             query = query.filter(Order.customer_id == customer_id)
        
        total = query.count()
        
        # Order by date desc
        query = query.order_by(desc(Order.order_date), desc(Order.order_id))
        
        offset = (page - 1) * page_size
        orders = query.offset(offset).limit(page_size).all()
        return orders, total

    def get_by_id(self, order_id: int) -> Optional[Order]:
        from sqlalchemy.orm import joinedload
        query = self.db.query(Order).options(
            joinedload(Order.customer),
            joinedload(Order.employee),
            joinedload(Order.order_details).joinedload(OrderDetail.product)
        ).filter(
            Order.order_id == order_id,
            Order.deleted_at.is_(None)
        )
        query = self._apply_access_filter(query)
        return query.first()

    def create(self, data: OrderCreate) -> Order:
        """Create order with order details."""
        # Validate customer
        customer = self.db.query(Customer).filter(Customer.customer_id == data.customer_id).first()
        if not customer:
             raise NotFoundError(f"Customer {data.customer_id} not found")

        # Create Order
        order = Order(
            customer_id=data.customer_id,
            employee_id=data.employee_id,
            order_date=data.order_date or date.today(),
            required_date=data.required_date,
            ship_via=data.ship_via,
            freight=data.freight,
            ship_name=data.ship_name,
            ship_address=data.ship_address,
            ship_city=data.ship_city,
            ship_region=data.ship_region,
            ship_postal_code=data.ship_postal_code,
            ship_country=data.ship_country,
            status=OrderStatus.PENDING
        )
        
        self.db.add(order)
        self.db.flush()  # Get order_id
        
        # Add order details
        for detail in data.order_details:
            product = self.db.query(Product).filter(
                Product.product_id == detail.product_id
            ).first()
            if not product:
                raise NotFoundError(f"Product {detail.product_id} not found")
            
            order_detail = OrderDetail(
                order_id=order.order_id,
                product_id=detail.product_id,
                unit_price=detail.unit_price or product.unit_price,
                quantity=detail.quantity,
                discount=detail.discount
            )
            self.db.add(order_detail)
        
        self.db.commit()
        self.db.refresh(order)
        return order
    
    def update(self, order_id: int, data: OrderUpdate) -> Order:
         order = self.get_by_id(order_id)
         if not order:
             raise NotFoundError(f"Order {order_id} not found")
         
         update_data = data.model_dump(exclude_unset=True)
         # Handle nested order_details if present
         details_data = update_data.pop("order_details", None)
        
        # Validate customer if changing
        if "customer_id" in update_data:
            customer = self.db.query(Customer).filter(Customer.customer_id == update_data["customer_id"]).first()
            if not customer:
                 raise NotFoundError(f"Customer {update_data['customer_id']} not found")

        for key, value in update_data.items():
            setattr(order, key, value)
            
        if details_data is not None:
            # Simple approach: replace all details
            self.db.query(OrderDetail).filter(OrderDetail.order_id == order_id).delete()
            for detail in details_data:
                product = self.db.query(Product).filter(Product.product_id == detail["product_id"]).first()
                if not product:
                     raise NotFoundError(f"Product {detail['product_id']} not found")
                
                order_detail = OrderDetail(
                    order_id=order_id,
                    product_id=detail["product_id"],
                    unit_price=detail.get("unit_price") or product.unit_price,
                    quantity=detail["quantity"],
                    discount=detail["discount"]
                )
                self.db.add(order_detail)

        self.db.commit()
        self.db.refresh(order)
        return order

    def update_status(self, order_id: int, new_status: OrderStatus) -> Order:
        """Update order status with validation."""
        order = self.get_by_id(order_id)
        if not order:
            raise NotFoundError(f"Order {order_id} not found")
        
        # Validate status transitions
        valid_transitions = {
            OrderStatus.PENDING: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
            OrderStatus.PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
            OrderStatus.SHIPPED: [OrderStatus.DELIVERED],
            OrderStatus.DELIVERED: [],
            OrderStatus.CANCELLED: [],
        }
        
        if new_status != order.status and new_status not in valid_transitions.get(order.status, []):
                raise ValidationError(
                    f"Cannot transition from {order.status.value} to {new_status.value}"
                )
        
        order.status = new_status
        
        # Set shipped_date when marking as shipped
        if new_status == OrderStatus.SHIPPED and not order.shipped_date:
            order.shipped_date = date.today()
        
        self.db.commit()
        self.db.refresh(order)
        return order
        
    def delete(self, order_id: int) -> bool:
        order = self.get_by_id(order_id)
        if not order:
             raise NotFoundError(f"Order {order_id} not found")
        
        order.deleted_at = datetime.utcnow()
        self.db.commit()
        return True
