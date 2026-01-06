import pytest
from app.models.user import UserRole

def test_create_customer(client, admin_token, db):
    # Cleanup first
    from app.models.customer import Customer
    existing = db.query(Customer).filter(Customer.customer_id == "TESTC").first()
    if existing:
        db.delete(existing)
        db.commit()

    response = client.post(
        "/api/v1/customers",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "customer_id": "TESTC",
            "company_name": "Test Company",
            "contact_name": "John Doe",
            "city": "Test City",
            "country": "Test Country"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["customer_id"] == "TESTC"
    assert data["company_name"] == "Test Company"

def test_get_customer(client, admin_token, db, test_customer):
    response = client.get(
        f"/api/v1/customers/{test_customer.customer_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["customer_id"] == test_customer.customer_id
    assert data["company_name"] == test_customer.company_name

def test_list_customers(client, admin_token, db, test_customer):
    response = client.get(
        "/api/v1/customers",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) >= 1
    found = any(c["customer_id"] == test_customer.customer_id for c in data["data"])
    assert found

def test_update_customer(client, admin_token, db, test_customer):
    response = client.put(
        f"/api/v1/customers/{test_customer.customer_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "company_name": "Updated Company"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["company_name"] == "Updated Company"
    assert data["contact_name"] == test_customer.contact_name # unchanged

def test_delete_customer(client, admin_token, db, test_customer):
    response = client.delete(
        f"/api/v1/customers/{test_customer.customer_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 204
    
    # Verify deletion
    response = client.get(
        f"/api/v1/customers/{test_customer.customer_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 404

def test_customer_role_isolation(client, db, test_customer_user, test_customer):
    # Link creating customer to test_customer user
    test_customer.user_id = test_customer_user.user_id
    db.commit()
    
    # Login as customer
    login_res = client.post("/api/v1/auth/login", json={
        "username": test_customer_user.username,
        "password": "TestCustomer123!"
    })
    token = login_res.json()["access_token"]
    
    # Get /me
    response = client.get(
        "/api/v1/customers/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["customer_id"] == test_customer.customer_id
    
    # Try to see another customer (if existed - creating one via admin first)
    # Actually we can just try to see unrelated data filters?
    # Or create another customer without user link
    from app.models.customer import Customer
    other_customer = Customer(customer_id="OTHER", company_name="Other Co")
    db.add(other_customer)
    db.commit()
    
    # List should only show own
    response = client.get(
        "/api/v1/customers",
        headers={"Authorization": f"Bearer {token}"}
    )
    data = response.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["customer_id"] == test_customer.customer_id
    
    # Get other detail should fail (or return 404/empty) - Service returns None, Router raises 404
    response = client.get(
        "/api/v1/customers/OTHER",
        headers={"Authorization": f"Bearer {token}"}
    )
    # The service.get_by_id applies filter, so returns None. Router raises 404.
    assert response.status_code == 404
