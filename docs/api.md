# API Documentation

Complete API reference for the Northwind Web Application.

## Base URL

- **Development**: `http://localhost:8000/api/v1`
- **Production**: `https://yourdomain.com/api/v1`

## Authentication

The API uses JWT (JSON Web Token) for authentication.

### Obtaining a Token

**Endpoint**: `POST /auth/login`

**Request:**
```json
{
  "email": "admin@northwind.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "admin@northwind.com",
    "full_name": "Admin User",
    "role": "admin",
    "is_active": true
  }
}
```

### Using the Token

Include the token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Default Users

| Email | Password | Role |
|-------|----------|------|
| admin@northwind.com | admin123 | admin |
| manager@northwind.com | manager123 | manager |
| employee@northwind.com | employee123 | employee |

## Endpoints Overview

### Authentication
- `POST /auth/login` - Login
- `POST /auth/register` - Register new user (admin only)
- `GET /auth/me` - Get current user

### Categories
- `GET /categories` - List categories
- `GET /categories/{id}` - Get category
- `POST /categories` - Create category (admin/manager)
- `PUT /categories/{id}` - Update category (admin/manager)
- `DELETE /categories/{id}` - Delete category (admin)

### Suppliers
- `GET /suppliers` - List suppliers
- `GET /suppliers/{id}` - Get supplier
- `POST /suppliers` - Create supplier (admin/manager)
- `PUT /suppliers/{id}` - Update supplier (admin/manager)
- `DELETE /suppliers/{id}` - Delete supplier (admin)

### Products
- `GET /products` - List products
- `GET /products/{id}` - Get product
- `POST /products` - Create product (admin/manager)
- `PUT /products/{id}` - Update product (admin/manager)
- `DELETE /products/{id}` - Delete product (admin)

### Customers
- `GET /customers` - List customers
- `GET /customers/{id}` - Get customer
- `POST /customers` - Create customer
- `PUT /customers/{id}` - Update customer
- `DELETE /customers/{id}` - Delete customer (admin)

### Employees
- `GET /employees` - List employees
- `GET /employees/{id}` - Get employee
- `POST /employees` - Create employee (admin)
- `PUT /employees/{id}` - Update employee (admin/manager)
- `DELETE /employees/{id}` - Delete employee (admin)

### Orders
- `GET /orders` - List orders
- `GET /orders/{id}` - Get order
- `POST /orders` - Create order
- `PUT /orders/{id}` - Update order
- `PATCH /orders/{id}/status` - Update order status
- `DELETE /orders/{id}` - Delete order (admin)

### Users
- `GET /users` - List users (admin)
- `GET /users/{id}` - Get user (admin)
- `POST /users` - Create user (admin)
- `PUT /users/{id}` - Update user (admin)
- `PATCH /users/{id}/activate` - Activate user (admin)
- `PATCH /users/{id}/deactivate` - Deactivate user (admin)
- `POST /users/{id}/reset-password` - Reset password (admin)

### Dashboard
- `GET /dashboard/stats` - Get dashboard statistics
- `GET /dashboard/charts/sales` - Sales chart data
- `GET /dashboard/charts/orders` - Orders chart data

## Detailed Endpoints

### Categories

#### List Categories

```http
GET /categories?skip=0&limit=10&search=beverages
```

**Query Parameters:**
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum records to return (default: 10, max: 100)
- `search` (optional): Search by name or description

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Beverages",
      "description": "Soft drinks, coffees, teas, beers, and ales",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 10
}
```

#### Create Category

```http
POST /categories
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Electronics",
  "description": "Electronic devices and accessories"
}
```

**Response:** `201 Created`
```json
{
  "id": 9,
  "name": "Electronics",
  "description": "Electronic devices and accessories",
  "created_at": "2024-01-07T00:00:00Z",
  "updated_at": "2024-01-07T00:00:00Z"
}
```

### Products

#### List Products

```http
GET /products?skip=0&limit=10&category_id=1&supplier_id=2&search=chai&min_price=10&max_price=50&in_stock=true&sort_by=name&sort_order=asc
```

**Query Parameters:**
- `skip`, `limit`: Pagination
- `category_id`: Filter by category
- `supplier_id`: Filter by supplier
- `search`: Search by name
- `min_price`, `max_price`: Price range
- `in_stock`: Only in-stock products
- `sort_by`: Field to sort by (name, price, stock)
- `sort_order`: asc or desc

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Chai",
      "supplier_id": 1,
      "category_id": 1,
      "quantity_per_unit": "10 boxes x 20 bags",
      "unit_price": 18.00,
      "units_in_stock": 39,
      "units_on_order": 0,
      "reorder_level": 10,
      "discontinued": false,
      "category": {
        "id": 1,
        "name": "Beverages"
      },
      "supplier": {
        "id": 1,
        "company_name": "Exotic Liquids"
      }
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 10
}
```

#### Create Product

```http
POST /products
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "New Product",
  "supplier_id": 1,
  "category_id": 1,
  "quantity_per_unit": "12 units",
  "unit_price": 25.50,
  "units_in_stock": 100,
  "units_on_order": 0,
  "reorder_level": 20,
  "discontinued": false
}
```

### Orders

#### List Orders

```http
GET /orders?skip=0&limit=10&customer_id=ALFKI&employee_id=1&status=pending&from_date=2024-01-01&to_date=2024-12-31
```

**Query Parameters:**
- `customer_id`: Filter by customer
- `employee_id`: Filter by employee
- `status`: Filter by status (pending, processing, shipped, delivered, cancelled)
- `from_date`, `to_date`: Date range

**Response:**
```json
{
  "items": [
    {
      "id": 10248,
      "customer_id": "VINET",
      "employee_id": 5,
      "order_date": "2024-01-01",
      "required_date": "2024-01-15",
      "shipped_date": "2024-01-05",
      "ship_via": 3,
      "freight": 32.38,
      "ship_name": "Vins et alcools Chevalier",
      "ship_address": "59 rue de l'Abbaye",
      "ship_city": "Reims",
      "ship_postal_code": "51100",
      "ship_country": "France",
      "status": "delivered",
      "customer": {
        "id": "VINET",
        "company_name": "Vins et alcools Chevalier"
      },
      "employee": {
        "id": 5,
        "first_name": "Steven",
        "last_name": "Buchanan"
      },
      "order_details": [
        {
          "product_id": 11,
          "unit_price": 14.00,
          "quantity": 12,
          "discount": 0.0,
          "product": {
            "id": 11,
            "name": "Queso Cabrales"
          }
        }
      ]
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 10
}
```

#### Create Order

```http
POST /orders
Authorization: Bearer <token>
```

**Request:**
```json
{
  "customer_id": "ALFKI",
  "employee_id": 1,
  "order_date": "2024-01-07",
  "required_date": "2024-01-21",
  "ship_via": 1,
  "freight": 15.50,
  "ship_name": "Alfreds Futterkiste",
  "ship_address": "Obere Str. 57",
  "ship_city": "Berlin",
  "ship_postal_code": "12209",
  "ship_country": "Germany",
  "order_details": [
    {
      "product_id": 1,
      "unit_price": 18.00,
      "quantity": 10,
      "discount": 0.0
    },
    {
      "product_id": 2,
      "unit_price": 19.00,
      "quantity": 5,
      "discount": 0.05
    }
  ]
}
```

#### Update Order Status

```http
PATCH /orders/10248/status
Authorization: Bearer <token>
```

**Request:**
```json
{
  "status": "shipped",
  "shipped_date": "2024-01-07"
}
```

### Dashboard

#### Get Statistics

```http
GET /dashboard/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_revenue": 1234567.89,
  "total_orders": 830,
  "total_customers": 91,
  "total_products": 77,
  "recent_orders": [...],
  "top_products": [...],
  "low_stock_products": [...]
}
```

## Error Responses

### Standard Error Format

```json
{
  "detail": "Error message here"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

### Validation Error Format

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production deployments.

## Pagination

All list endpoints support pagination:

- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum records to return (default: 10, max: 100)

Response includes:
- `items`: Array of results
- `total`: Total count of matching records
- `skip`: Applied skip value
- `limit`: Applied limit value

## Interactive Documentation

Visit these URLs for interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These interfaces allow you to:
- Browse all endpoints
- See request/response schemas
- Try out API calls directly
- View authentication requirements
