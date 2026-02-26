"""Extended integration tests for Customers API."""
import pytest


class TestCustomerFiltersAPI:
    def test_get_countries_unauthorized(self, client):
        response = client.get("/api/v1/customers/countries")
        assert response.status_code == 401

    def test_get_countries(self, client, admin_token, test_customer):
        response = client.get("/api/v1/customers/countries",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        countries = response.json()
        assert isinstance(countries, list)
        assert test_customer.country in countries

    def test_get_cities(self, client, admin_token, test_customer):
        response = client.get("/api/v1/customers/cities",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        cities = response.json()
        assert isinstance(cities, list)
        assert test_customer.city in cities

    def test_get_cities_filtered_by_country(self, client, admin_token, test_customer):
        response = client.get(f"/api/v1/customers/cities?country={test_customer.country}",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        cities = response.json()
        assert test_customer.city in cities


class TestCustomerListAPI:
    def test_list_customers_unauthorized(self, client):
        response = client.get("/api/v1/customers")
        assert response.status_code == 401

    def test_list_customers_search(self, client, admin_token, test_customer):
        response = client.get(f"/api/v1/customers?search={test_customer.company_name[:5]}",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["pagination"]["total_items"] >= 1

    def test_list_customers_filter_by_country(self, client, admin_token, test_customer):
        response = client.get(f"/api/v1/customers?country={test_customer.country}",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        for customer in data["data"]:
            assert customer["country"] == test_customer.country

    def test_list_customers_pagination(self, client, admin_token, test_customer):
        response = client.get("/api/v1/customers?page=1&page_size=1",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert "pagination" in data


class TestCustomerCRUDAPI:
    def test_create_customer_employee_forbidden(self, client, employee_token):
        response = client.post("/api/v1/customers", json={
            "customer_id": "TSTCE",
            "company_name": "Test Corp",
        }, headers={"Authorization": f"Bearer {employee_token}"})
        assert response.status_code == 403

    def test_create_customer_duplicate_id(self, client, admin_token, test_customer):
        response = client.post("/api/v1/customers", json={
            "customer_id": test_customer.customer_id,
            "company_name": "Duplicate",
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 409

    def test_get_customer_not_found(self, client, admin_token):
        response = client.get("/api/v1/customers/XXXXX",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 404

    def test_get_customer_includes_statistics(self, client, admin_token, test_customer):
        response = client.get(f"/api/v1/customers/{test_customer.customer_id}",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "statistics" in data
        assert data["statistics"]["total_orders"] == 0

    def test_update_customer_employee_forbidden(self, client, employee_token, test_customer):
        response = client.put(f"/api/v1/customers/{test_customer.customer_id}", json={
            "company_name": "Updated"
        }, headers={"Authorization": f"Bearer {employee_token}"})
        assert response.status_code == 403

    def test_update_customer_not_found(self, client, admin_token):
        response = client.put("/api/v1/customers/XXXXX", json={"company_name": "Nobody"},
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 404

    def test_delete_customer_employee_forbidden(self, client, employee_token, test_customer):
        response = client.delete(f"/api/v1/customers/{test_customer.customer_id}",
                                 headers={"Authorization": f"Bearer {employee_token}"})
        assert response.status_code == 403

    def test_delete_customer_not_found(self, client, admin_token):
        response = client.delete("/api/v1/customers/XXXXX",
                                 headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 404


class TestCustomerOrdersAPI:
    def test_get_customer_orders_empty(self, client, admin_token, test_customer):
        response = client.get(f"/api/v1/customers/{test_customer.customer_id}/orders",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["pagination"]["total_items"] == 0

    def test_get_customer_orders_with_data(self, client, admin_token, test_customer, test_product):
        # Create an order for this customer
        client.post("/api/v1/orders", json={
            "customer_id": test_customer.customer_id,
            "order_details": [{"product_id": test_product.product_id, "quantity": 1}]
        }, headers={"Authorization": f"Bearer {admin_token}"})

        response = client.get(f"/api/v1/customers/{test_customer.customer_id}/orders",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["pagination"]["total_items"] == 1

    def test_customer_cannot_see_other_customer_orders(self, client, db_session,
                                                        test_customer_user, test_customer,
                                                        test_product, admin_token):
        test_customer.user_id = test_customer_user.user_id
        db_session.commit()

        # Create order as another customer
        from app.models.customer import Customer
        other = Customer(customer_id="OTHCC", company_name="Other")
        db_session.add(other)
        db_session.commit()
        client.post("/api/v1/orders", json={
            "customer_id": "OTHCC",
            "order_details": [{"product_id": test_product.product_id, "quantity": 1}]
        }, headers={"Authorization": f"Bearer {admin_token}"})

        login_res = client.post("/api/v1/auth/login", json={
            "username": test_customer_user.username,
            "password": "TestCustomer123!"
        })
        token = login_res.json()["access_token"]

        response = client.get("/api/v1/customers/OTHCC/orders",
                              headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 403


class TestCustomerMeEndpoint:
    def test_get_me_as_non_customer_no_profile(self, client, admin_token):
        response = client.get("/api/v1/customers/me",
                              headers={"Authorization": f"Bearer {admin_token}"})
        # Admin has no customer profile
        assert response.status_code == 404

    def test_get_me_as_customer_with_profile(self, client, db_session, test_customer_user, test_customer):
        test_customer.user_id = test_customer_user.user_id
        db_session.commit()

        login_res = client.post("/api/v1/auth/login", json={
            "username": test_customer_user.username,
            "password": "TestCustomer123!"
        })
        token = login_res.json()["access_token"]

        response = client.get("/api/v1/customers/me",
                              headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["customer_id"] == test_customer.customer_id
        assert "statistics" in data
