import pytest
from decimal import Decimal
from pydantic import ValidationError as PydanticValidationError
from app.services.product_service import ProductService
from app.services.order_service import OrderService
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.order import OrderCreate, OrderStatus
from app.utils.exceptions import ValidationError, NotFoundError

class TestProductEdgeCases:
    def test_create_product_with_negative_price(self, db_session):
        """Should reject negative prices via Pydantic validation."""
        service = ProductService(db_session)
        with pytest.raises(PydanticValidationError):
            ProductCreate(
                product_name="Bad Product",
                unit_price=Decimal("-10.00")
            )
    
    def test_update_units_below_zero(self, db_session, sample_product):
        """Should reject negative stock via Pydantic validation."""
        service = ProductService(db_session)
        with pytest.raises(PydanticValidationError):
            ProductUpdate(units_in_stock=-5)
    
    def test_discontinue_already_discontinued(self, db_session, sample_product):
        """Discontinuing already discontinued product should not error."""
        service = ProductService(db_session)
        sample_product.discontinued = True
        db_session.commit()
        
        result = service.discontinue(sample_product.product_id)
        assert result.discontinued is True

class TestOrderEdgeCases:
    def test_create_order_with_no_items(self, db_session, test_customer):
        """Should reject orders with no items via Pydantic validation."""
        with pytest.raises(PydanticValidationError):
            OrderCreate(
                customer_id=test_customer.customer_id,
                order_details=[]
            )
    
    def test_order_with_discontinued_product(self, db_session, test_customer, sample_product):
        """Should allow ordering discontinued products (business rule check)."""
        sample_product.discontinued = True
        db_session.commit()
        
        service = OrderService(db_session)
        order = service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            order_details=[{
                "product_id": sample_product.product_id,
                "quantity": 1
            }]
        ))
        assert order is not None
        assert order.order_details[0].product_id == sample_product.product_id
    
    def test_invalid_status_transition(self, db_session, test_customer, sample_product):
        """Should reject invalid status transitions."""
        service = OrderService(db_session)
        order = service.create(OrderCreate(
            customer_id=test_customer.customer_id,
            order_details=[{
                "product_id": sample_product.product_id,
                "quantity": 1
            }]
        ))
        
        # Manually set to Delivered
        order.status = OrderStatus.DELIVERED
        db_session.commit()
        
        with pytest.raises(ValidationError) as exc:
            service.update_status(order.order_id, OrderStatus.PENDING)
        assert "Cannot transition from delivered to pending" in str(exc.value)

class TestAuthEdgeCases:
    def test_login_with_inactive_user(self, client, db_session, admin_user):
        """Inactive users should not be able to login."""
        admin_user.is_active = False
        db_session.commit()
        
        response = client.post("/api/v1/auth/login", json={
            "username": "testadmin",
            "password": "TestAdmin123!"
        })
        assert response.status_code == 401
