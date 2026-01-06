import pytest
from fastapi.testclient import TestClient
from app.models.product import Product
from app.models.category import Category
from app.models.supplier import Supplier
from decimal import Decimal

def test_get_products_unauthorized(client: TestClient):
    response = client.get("/api/v1/products")
    assert response.status_code == 401

def test_get_products_authorized(client: TestClient, auth_token: str):
    response = client.get(
        "/api/v1/products",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    assert "data" in response.json()
    assert "pagination" in response.json()

def test_admin_create_product(client: TestClient, admin_token: str, db_session):
    # Setup dependencies
    cat = Category(category_name="Test API Electronics")
    sup = Supplier(company_name="Test API Tech Corp")
    db_session.add(cat)
    db_session.add(sup)
    db_session.commit()
    
    product_data = {
        "product_name": "Laptop",
        "category_id": cat.category_id,
        "supplier_id": sup.supplier_id,
        "unit_price": 999.99,
        "units_in_stock": 10
    }
    
    response = client.post(
        "/api/v1/products",
        json=product_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["product_name"] == "Laptop"
    assert data["category"]["category_name"] == "Test API Electronics"
    assert data["supplier"]["company_name"] == "Test API Tech Corp"

def test_employee_cannot_create_product(client: TestClient, auth_token: str):
    product_data = {
        "product_name": "Unauthorized Laptop",
        "unit_price": 500.00
    }
    response = client.post(
        "/api/v1/products",
        json=product_data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 403

def test_get_price_range(client: TestClient, admin_token: str, db_session):
    # Ensure some products exist
    db_session.add(Product(product_name="Cheap", unit_price=Decimal("10.00")))
    db_session.add(Product(product_name="Expensive", unit_price=Decimal("100.00")))
    db_session.commit()
    
    response = client.get(
        "/api/v1/products/filters/price-range",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert float(data["min"]) <= 10.0
    assert float(data["max"]) >= 100.0

def test_discontinue_product_endpoint(client: TestClient, admin_token: str, db_session):
    p = Product(product_name="Old Phone", discontinued=False)
    db_session.add(p)
    db_session.commit()
    
    response = client.patch(
        f"/api/v1/products/{p.product_id}/discontinue",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert response.json()["discontinued"] is True

def test_delete_product_endpoint(client: TestClient, admin_token: str, db_session):
    p = Product(product_name="To Delete")
    db_session.add(p)
    db_session.commit()
    
    response = client.delete(
        f"/api/v1/products/{p.product_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 204
    
    # Verify soft delete
    db_session.expire_all()
    p_after = db_session.query(Product).filter(Product.product_id == p.product_id).first()
    assert p_after.deleted_at is not None
