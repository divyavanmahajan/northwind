import pytest
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.category import Category
from app.models.supplier import Supplier
from app.services.product_service import ProductService
from app.schemas.product import ProductCreate, ProductUpdate
from decimal import Decimal
from app.utils.exceptions import NotFoundError

@pytest.fixture
def product_service(db_session: Session):
    return ProductService(db_session)

@pytest.fixture
def sample_category(db_session: Session):
    # Try to get existing category first
    category = db_session.query(Category).filter(
        Category.category_name == "Test Fruits"
    ).first()
    
    if not category:
        category = Category(category_name="Test Fruits", description="Fresh fruits for testing")
        db_session.add(category)
        db_session.commit()
        db_session.refresh(category)
    
    return category

@pytest.fixture
def sample_supplier(db_session: Session):
    # Try to get existing supplier first
    supplier = db_session.query(Supplier).filter(
        Supplier.company_name == "Test Fruit Co"
    ).first()
    
    if not supplier:
        supplier = Supplier(company_name="Test Fruit Co", country="USA", city="New York")
        db_session.add(supplier)
        db_session.commit()
        db_session.refresh(supplier)
    
    return supplier

def test_create_product(product_service, sample_category, sample_supplier):
    product_in = ProductCreate(
        product_name="Apple",
        category_id=sample_category.category_id,
        supplier_id=sample_supplier.supplier_id,
        unit_price=Decimal("1.50"),
        units_in_stock=100,
        reorder_level=10
    )
    product = product_service.create(product_in)
    assert product.product_name == "Apple"
    assert product.category_id == sample_category.category_id
    assert product.supplier_id == sample_supplier.supplier_id
    assert product.unit_price == Decimal("1.50")
    assert product.stock_status == "in_stock"

def test_get_product_by_id(product_service, sample_category):
    product_in = ProductCreate(
        product_name="Banana",
        category_id=sample_category.category_id,
        unit_price=Decimal("0.50"),
        units_in_stock=50
    )
    product = product_service.create(product_in)
    
    fetched = product_service.get_by_id(product.product_id)
    assert fetched is not None
    assert fetched.product_name == "Banana"
    assert fetched.category.category_name == "Test Fruits"

def test_get_products_list_filtering(product_service, sample_category, sample_supplier):
    # Create multiple products
    product_service.create(ProductCreate(
        product_name="Expensive Apple",
        category_id=sample_category.category_id,
        unit_price=Decimal("10.00"),
        units_in_stock=5
    ))
    product_service.create(ProductCreate(
        product_name="Cheap Banana",
        category_id=sample_category.category_id,
        unit_price=Decimal("1.00"),
        units_in_stock=0
    ))
    
    # Filter by price
    products, total = product_service.get_list(price_min=Decimal("5.00"))
    assert total >= 1
    assert any(p.product_name == "Expensive Apple" for p in products)
    
    # Filter by stock status
    products, total = product_service.get_list(stock_status="out_of_stock")
    assert any(p.product_name == "Cheap Banana" for p in products)

def test_discontinue_product(product_service, sample_category):
    product_in = ProductCreate(
        product_name="Old Item",
        category_id=sample_category.category_id,
        units_in_stock=10
    )
    product = product_service.create(product_in)
    
    discontinued = product_service.discontinue(product.product_id)
    assert discontinued.discontinued is True
    assert discontinued.stock_status == "discontinued"

def test_search_across_relationships(product_service, sample_category, sample_supplier):
    # Category name is "Test Fruits", Supplier is "Test Fruit Co"
    product_service.create(ProductCreate(
        product_name="Red Delicious",
        category_id=sample_category.category_id,
        supplier_id=sample_supplier.supplier_id
    ))
    
    # Search by category name
    products, total = product_service.get_list(search="Test Fruits")
    assert total >= 1
    assert any(p.product_name == "Red Delicious" for p in products)
    
    # Search by supplier name
    products, total = product_service.get_list(search="Fruit Co")
    assert total >= 1
    assert any(p.product_name == "Red Delicious" for p in products)

def test_soft_delete_product(product_service, sample_category):
    product = product_service.create(ProductCreate(
        product_name="To be deleted",
        category_id=sample_category.category_id
    ))
    
    product_service.delete(product.product_id)
    
    fetched = product_service.get_by_id(product.product_id)
    assert fetched is None
    
    # Ensure it's not in the list
    products, total = product_service.get_list()
    assert not any(p.product_id == product.product_id for p in products)

def test_invalid_category_fails(product_service):
    with pytest.raises(NotFoundError):
        product_service.create(ProductCreate(
            product_name="Invalid",
            category_id=9999
        ))
