"""Extended integration tests for Orders API."""
import pytest
from app.models.order import OrderStatus


class TestOrdersListAPI:
    def test_list_orders_unauthorized(self, client):
        response = client.get("/api/v1/orders")
        assert response.status_code == 401

    def test_list_orders_authorized_empty(self, client, admin_token):
        response = client.get("/api/v1/orders",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "pagination" in data
        assert data["pagination"]["total_items"] == 0

    def test_list_orders_pagination(self, client, admin_token, test_customer, test_product):
        # Create 3 orders
        for _ in range(3):
            client.post("/api/v1/orders", json={
                "customer_id": test_customer.customer_id,
                "order_details": [{"product_id": test_product.product_id, "quantity": 1}]
            }, headers={"Authorization": f"Bearer {admin_token}"})

        response = client.get("/api/v1/orders?page=1&page_size=2",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 2
        assert data["pagination"]["total_items"] == 3
        assert data["pagination"]["has_next"] is True

    def test_list_orders_filter_by_status(self, client, admin_token, test_customer, test_product):
        client.post("/api/v1/orders", json={
            "customer_id": test_customer.customer_id,
            "order_details": [{"product_id": test_product.product_id, "quantity": 1}]
        }, headers={"Authorization": f"Bearer {admin_token}"})

        response = client.get("/api/v1/orders?status=pending",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["pagination"]["total_items"] >= 1
        for order in data["data"]:
            assert order["status"] == "pending"

    def test_list_orders_filter_by_customer(self, client, admin_token, test_customer, test_product):
        client.post("/api/v1/orders", json={
            "customer_id": test_customer.customer_id,
            "order_details": [{"product_id": test_product.product_id, "quantity": 1}]
        }, headers={"Authorization": f"Bearer {admin_token}"})

        response = client.get(f"/api/v1/orders?customer_id={test_customer.customer_id}",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["pagination"]["total_items"] >= 1


class TestOrdersGetStatusesAPI:
    def test_get_statuses(self, client, admin_token):
        response = client.get("/api/v1/orders/filters/statuses",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        statuses = response.json()
        assert "pending" in statuses
        assert "processing" in statuses
        assert "shipped" in statuses
        assert "delivered" in statuses
        assert "cancelled" in statuses


class TestOrderGetAPI:
    def test_get_order_not_found(self, client, admin_token):
        response = client.get("/api/v1/orders/999999",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 404

    def test_get_order_success(self, client, admin_token, test_customer, test_product):
        create_res = client.post("/api/v1/orders", json={
            "customer_id": test_customer.customer_id,
            "order_details": [{"product_id": test_product.product_id, "quantity": 2}]
        }, headers={"Authorization": f"Bearer {admin_token}"})
        order_id = create_res.json()["order_id"]

        response = client.get(f"/api/v1/orders/{order_id}",
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["order_id"] == order_id
        assert len(data["order_details"]) == 1


class TestOrderCreateAPI:
    def test_create_order_missing_customer(self, client, admin_token, test_product):
        response = client.post("/api/v1/orders", json={
            "customer_id": "XXXXX",
            "order_details": [{"product_id": test_product.product_id, "quantity": 1}]
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 404

    def test_create_order_missing_product(self, client, admin_token, test_customer):
        response = client.post("/api/v1/orders", json={
            "customer_id": test_customer.customer_id,
            "order_details": [{"product_id": 999999, "quantity": 1}]
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 404

    def test_create_order_empty_details_rejected(self, client, admin_token, test_customer):
        response = client.post("/api/v1/orders", json={
            "customer_id": test_customer.customer_id,
            "order_details": []
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 400

    def test_create_order_with_shipping_info(self, client, admin_token, test_customer, test_product):
        response = client.post("/api/v1/orders", json={
            "customer_id": test_customer.customer_id,
            "ship_name": "Acme Corp",
            "ship_address": "1 Main St",
            "ship_city": "Springfield",
            "ship_country": "US",
            "order_details": [{"product_id": test_product.product_id, "quantity": 1}]
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 201
        data = response.json()
        assert data["ship_name"] == "Acme Corp"
        assert data["ship_city"] == "Springfield"


class TestOrderUpdateAPI:
    def test_update_order_shipping(self, client, admin_token, test_customer, test_product):
        create_res = client.post("/api/v1/orders", json={
            "customer_id": test_customer.customer_id,
            "order_details": [{"product_id": test_product.product_id, "quantity": 1}]
        }, headers={"Authorization": f"Bearer {admin_token}"})
        order_id = create_res.json()["order_id"]

        response = client.put(f"/api/v1/orders/{order_id}", json={
            "ship_city": "New City",
            "ship_country": "Germany"
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["ship_city"] == "New City"
        assert data["ship_country"] == "Germany"

    def test_update_order_not_found(self, client, admin_token):
        response = client.put("/api/v1/orders/999999", json={"ship_city": "Nowhere"},
                              headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 404


class TestOrderStatusAPI:
    def test_full_status_workflow(self, client, admin_token, test_customer, test_product):
        # Create
        res = client.post("/api/v1/orders", json={
            "customer_id": test_customer.customer_id,
            "order_details": [{"product_id": test_product.product_id, "quantity": 1}]
        }, headers={"Authorization": f"Bearer {admin_token}"})
        order_id = res.json()["order_id"]

        # Pending -> Processing
        res = client.patch(f"/api/v1/orders/{order_id}/status?status=processing",
                           headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200
        assert res.json()["status"] == "processing"

        # Processing -> Cancelled
        res = client.patch(f"/api/v1/orders/{order_id}/status?status=cancelled",
                           headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200
        assert res.json()["status"] == "cancelled"

    def test_invalid_status_transition_returns_400(self, client, admin_token, test_customer, test_product):
        res = client.post("/api/v1/orders", json={
            "customer_id": test_customer.customer_id,
            "order_details": [{"product_id": test_product.product_id, "quantity": 1}]
        }, headers={"Authorization": f"Bearer {admin_token}"})
        order_id = res.json()["order_id"]

        # Pending -> Delivered is invalid
        res = client.patch(f"/api/v1/orders/{order_id}/status?status=delivered",
                           headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 400

    def test_status_order_not_found(self, client, admin_token):
        res = client.patch("/api/v1/orders/999999/status?status=processing",
                           headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 404


class TestOrderDeleteAPI:
    def test_delete_requires_admin_or_manager(self, client, employee_token, test_customer, test_product, admin_token):
        res = client.post("/api/v1/orders", json={
            "customer_id": test_customer.customer_id,
            "order_details": [{"product_id": test_product.product_id, "quantity": 1}]
        }, headers={"Authorization": f"Bearer {admin_token}"})
        order_id = res.json()["order_id"]

        res = client.delete(f"/api/v1/orders/{order_id}",
                            headers={"Authorization": f"Bearer {employee_token}"})
        assert res.status_code == 403

    def test_delete_not_found(self, client, admin_token):
        res = client.delete("/api/v1/orders/999999",
                            headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 404


class TestOrderCustomerRoleIsolation:
    def test_customer_can_only_see_own_orders(self, client, db_session, test_customer_user, test_customer,
                                              test_product, admin_token):
        # Link customer to user
        test_customer.user_id = test_customer_user.user_id
        db_session.commit()

        # Create an order for this customer (as admin)
        client.post("/api/v1/orders", json={
            "customer_id": test_customer.customer_id,
            "order_details": [{"product_id": test_product.product_id, "quantity": 1}]
        }, headers={"Authorization": f"Bearer {admin_token}"})

        # Create another customer with an order
        from app.models.customer import Customer
        other_cust = Customer(customer_id="OTHCR", company_name="Other")
        db_session.add(other_cust)
        db_session.commit()
        client.post("/api/v1/orders", json={
            "customer_id": "OTHCR",
            "order_details": [{"product_id": test_product.product_id, "quantity": 1}]
        }, headers={"Authorization": f"Bearer {admin_token}"})

        # Login as customer
        login_res = client.post("/api/v1/auth/login", json={
            "username": test_customer_user.username,
            "password": "TestCustomer123!"
        })
        token = login_res.json()["access_token"]

        response = client.get("/api/v1/orders", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        # Should only see own orders (1), not total 2
        assert data["pagination"]["total_items"] == 1
