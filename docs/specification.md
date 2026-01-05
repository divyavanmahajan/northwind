# Northwind Web Application - Technical Specification

**Version:** 1.0  
**Date:** 2026-01-04  
**Status:** Ready for Development

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Authentication & Security](#authentication--security)
6. [Database Design](#database-design)
7. [API Specification](#api-specification)
8. [Frontend Architecture](#frontend-architecture)
9. [Features & Functionality](#features--functionality)
10. [Data Seeding](#data-seeding)
11. [Testing Strategy](#testing-strategy)
12. [Deployment & DevOps](#deployment--devops)
13. [Documentation Requirements](#documentation-requirements)
14. [Development Workflow](#development-workflow)

---

## 1. Project Overview

### 1.1 Purpose
Build a modern, full-stack web application based on the Northwind database with role-based access control, comprehensive CRUD operations, and advanced data management features.

### 1.2 Goals
- Provide secure, role-based access to Northwind business data
- Deliver a modern, responsive user interface
- Implement robust API with proper authentication
- Enable efficient data search, filtering, sorting, and pagination
- Maintain high code quality with comprehensive testing

### 1.3 Target Users
- **Administrators**: Full system access and user management
- **Managers**: Business operations and data management
- **Employees**: Day-to-day operational tasks
- **Customers**: Self-service order tracking and product browsing

---

## 2. System Architecture

### 2.1 Architecture Pattern
**Three-tier architecture:**
- **Presentation Layer**: React SPA with Vite
- **Application Layer**: FastAPI REST API
- **Data Layer**: PostgreSQL database

### 2.2 Component Diagram

```
┌─────────────────────────────────────────┐
│         React Frontend (Vite)           │
│  - shadcn/ui Components                 │
│  - TanStack Query (Data Fetching)       │
│  - React Hook Form (Forms)              │
│  - Zustand (State Management)           │
└──────────────┬──────────────────────────┘
               │ HTTPS/REST API
               │ JWT Authentication
┌──────────────▼──────────────────────────┐
│         FastAPI Backend                  │
│  - JWT Authentication Middleware         │
│  - Role-Based Access Control             │
│  - SQLAlchemy ORM                        │
│  - Pydantic Validation                   │
└──────────────┬──────────────────────────┘
               │ SQLAlchemy
               │
┌──────────────▼──────────────────────────┐
│         PostgreSQL Database              │
│  - Northwind Schema                      │
│  - User & Auth Tables                    │
│  - Indexes & Constraints                 │
└─────────────────────────────────────────┘
```

### 2.3 Communication Flow
1. User interacts with React UI
2. TanStack Query manages API requests with JWT tokens
3. FastAPI validates JWT and checks permissions
4. SQLAlchemy executes database operations
5. Response flows back through layers to UI

---

## 3. Technology Stack

### 3.1 Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18+ | UI Framework |
| Vite | 5+ | Build Tool |
| TypeScript | 5+ | Type Safety |
| Tailwind CSS | 3+ | Styling |
| shadcn/ui | Latest | UI Components |
| TanStack Query | 5+ | Data Fetching & Caching |
| React Hook Form | 7+ | Form Management |
| Zustand | 4+ | State Management |
| React Router | 6+ | Routing |
| Chart.js | 4+ | Data Visualization |
| Zod | 3+ | Schema Validation |

### 3.2 Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | 0.109+ | Web Framework |
| SQLAlchemy | 2.0+ | ORM |
| Alembic | 1.13+ | Database Migrations |
| Pydantic | 2.0+ | Data Validation |
| python-jose | 3.3+ | JWT Handling |
| passlib | 1.7+ | Password Hashing |
| bcrypt | 4.0+ | Hashing Algorithm |
| pytest | 8.0+ | Testing Framework |
| pytest-asyncio | 0.23+ | Async Testing |

### 3.3 Database
| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 15+ | Primary Database |
| psycopg2 | 2.9+ | PostgreSQL Adapter |

### 3.4 DevOps
| Technology | Version | Purpose |
|------------|---------|---------|
| Docker | 24+ | Containerization |
| Docker Compose | 2.0+ | Multi-container Orchestration |
| Nginx | 1.25+ | Reverse Proxy (Production) |

---

## 4. User Roles & Permissions

### 4.1 Role Definitions

#### Admin
- **Description**: System administrators with full access
- **Capabilities**:
  - Full CRUD on all entities
  - User management (create, update, delete users)
  - Role assignment
  - System configuration
  - View all dashboards and reports

#### Manager
- **Description**: Business managers overseeing operations
- **Capabilities**:
  - Full CRUD on: Products, Orders, Customers, Suppliers, Categories
  - Read-only on: Employees
  - Cannot manage users or roles
  - Access to business dashboards

#### Employee
- **Description**: Staff members performing daily operations
- **Capabilities**:
  - Read-only on: Products, Orders, Categories, Suppliers
  - Cannot modify any data
  - Limited dashboard access

#### Customer
- **Description**: External customers accessing their data
- **Capabilities**:
  - Read-only on: Products, Categories
  - Read-only on: Their own Orders
  - Cannot view other customers' data
  - Personal dashboard with order history

### 4.2 Permission Matrix

| Entity | Admin | Manager | Employee | Customer |
|--------|-------|---------|----------|----------|
| **Users** | CRUD | - | - | - |
| **Products** | CRUD | CRUD | R | R |
| **Orders** | CRUD | CRUD | R | R (own only) |
| **Customers** | CRUD | CRUD | R | R (self only) |
| **Employees** | CRUD | R | R | - |
| **Suppliers** | CRUD | CRUD | R | - |
| **Categories** | CRUD | CRUD | R | R |
| **Order Details** | CRUD | CRUD | R | R (own only) |
| **Shippers** | CRUD | CRUD | R | - |

**Legend**: C=Create, R=Read, U=Update, D=Delete

---

## 5. Authentication & Security

### 5.1 Authentication Flow

```
┌─────────┐                ┌─────────┐                ┌──────────┐
│ Client  │                │  API    │                │ Database │
└────┬────┘                └────┬────┘                └────┬─────┘
     │                          │                          │
     │ POST /api/v1/auth/login  │                          │
     │ {username, password}     │                          │
     ├─────────────────────────>│                          │
     │                          │ Verify credentials       │
     │                          ├─────────────────────────>│
     │                          │<─────────────────────────┤
     │                          │ User data                │
     │                          │                          │
     │                          │ Generate JWT             │
     │                          │ (expires in 24h)         │
     │<─────────────────────────┤                          │
     │ {access_token, user}     │                          │
     │                          │                          │
     │ GET /api/v1/products     │                          │
     │ Authorization: Bearer... │                          │
     ├─────────────────────────>│                          │
     │                          │ Validate JWT             │
     │                          │ Check permissions        │
     │                          ├─────────────────────────>│
     │                          │<─────────────────────────┤
     │<─────────────────────────┤                          │
     │ Products data            │                          │
```

### 5.2 JWT Configuration
- **Algorithm**: HS256
- **Expiration**: 24 hours
- **Payload**:
  ```json
  {
    "sub": "user_id",
    "username": "john.doe",
    "role": "manager",
    "exp": 1704499200
  }
  ```
- **Storage**: LocalStorage (frontend)
- **Header**: `Authorization: Bearer <token>`

### 5.3 Password Security
- **Hashing**: bcrypt with salt rounds = 12
- **Requirements**:
  - Minimum length: 8 characters
  - Must contain: uppercase, lowercase, number, special character
- **Storage**: Hashed passwords only, never plaintext

### 5.4 Security Best Practices
- **Input Validation**: All inputs validated with Pydantic schemas
- **SQL Injection Prevention**: SQLAlchemy ORM with parameterized queries
- **XSS Prevention**: React's built-in escaping + Content Security Policy headers
- **CORS**: Configured for specific origins only
- **Rate Limiting**: 5 requests/second per IP on auth endpoints
- **HTTPS Only**: Enforced in production
- **Secure Headers**: 
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000`

---

## 6. Database Design

### 6.1 Northwind Schema

The application uses the standard Northwind database schema with the following tables:

#### Core Tables
1. **categories**
   - category_id (PK)
   - category_name
   - description
   - picture

2. **suppliers**
   - supplier_id (PK)
   - company_name
   - contact_name
   - contact_title
   - address, city, region, postal_code, country
   - phone, fax, homepage

3. **products**
   - product_id (PK)
   - product_name
   - supplier_id (FK)
   - category_id (FK)
   - quantity_per_unit
   - unit_price
   - units_in_stock
   - units_on_order
   - reorder_level
   - discontinued
   - created_at, updated_at, deleted_at (soft delete)

4. **customers**
   - customer_id (PK)
   - company_name
   - contact_name
   - contact_title
   - address, city, region, postal_code, country
   - phone, fax
   - user_id (FK - links to users table)
   - created_at, updated_at, deleted_at

5. **employees**
   - employee_id (PK)
   - last_name, first_name, title, title_of_courtesy
   - birth_date, hire_date
   - address, city, region, postal_code, country
   - home_phone, extension
   - photo, notes
   - reports_to (FK - self-referencing)
   - photo_path
   - user_id (FK - links to users table)
   - created_at, updated_at, deleted_at

6. **shippers**
   - shipper_id (PK)
   - company_name
   - phone

7. **orders**
   - order_id (PK)
   - customer_id (FK)
   - employee_id (FK)
   - order_date
   - required_date
   - shipped_date
   - ship_via (FK to shippers)
   - freight
   - ship_name
   - ship_address, ship_city, ship_region, ship_postal_code, ship_country
   - status (pending, processing, shipped, delivered, cancelled)
   - created_at, updated_at, deleted_at

8. **order_details**
   - order_id (PK, FK)
   - product_id (PK, FK)
   - unit_price
   - quantity
   - discount

### 6.2 Authentication Tables

9. **users**
   - user_id (PK, UUID)
   - username (unique)
   - email (unique)
   - password_hash
   - role (admin, manager, employee, customer)
   - is_active
   - created_at
   - updated_at
   - last_login
   - created_by (FK to users)

### 6.3 Indexes

```sql
-- Performance indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_name ON products(product_name);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_employee ON orders(employee_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_details_product ON order_details(product_id);
CREATE INDEX idx_customers_company ON customers(company_name);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Soft delete indexes
CREATE INDEX idx_products_deleted ON products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_deleted ON customers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_deleted ON employees(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_deleted ON orders(deleted_at) WHERE deleted_at IS NULL;
```

### 6.4 Soft Delete Implementation

All major entities support soft deletes:
- Add `deleted_at` timestamp column (nullable)
- Default queries filter `WHERE deleted_at IS NULL`
- Delete operations set `deleted_at = NOW()`
- Admin can view/restore soft-deleted records

---

## 7. API Specification

### 7.1 Base URL Structure
```
/api/v1/{resource}
```

### 7.2 Authentication Endpoints

#### POST /api/v1/auth/login
**Description**: Authenticate user and receive JWT token

**Request**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "user_id": "uuid",
    "username": "string",
    "email": "string",
    "role": "admin|manager|employee|customer",
    "is_active": true
  }
}
```

**Errors**:
- 401: Invalid credentials
- 403: Account inactive

#### GET /api/v1/auth/me
**Description**: Get current user information

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "user_id": "uuid",
  "username": "string",
  "email": "string",
  "role": "string",
  "is_active": true,
  "last_login": "2026-01-04T22:00:00Z"
}
```

#### POST /api/v1/auth/refresh
**Description**: Refresh JWT token (optional future enhancement)

### 7.3 Resource Endpoints Pattern

All resources follow RESTful conventions:

#### GET /api/v1/{resource}
**Description**: List resources with pagination, filtering, sorting, search

**Query Parameters**:
```
?page=1
&page_size=25
&sort_by=field_name
&sort_order=asc|desc
&sort_by_secondary=field_name  // Multi-column sort
&sort_order_secondary=asc|desc
&search=query
&filter[field]=value
&filter[field_min]=value  // Range filters
&filter[field_max]=value
```

**Response** (200):
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 25,
    "total_items": 100,
    "total_pages": 4,
    "has_next": true,
    "has_previous": false
  },
  "filters_applied": {...},
  "sort_applied": [
    {"field": "category_name", "order": "asc"},
    {"field": "unit_price", "order": "desc"}
  ]
}
```

#### GET /api/v1/{resource}/{id}
**Description**: Get single resource by ID

**Response** (200):
```json
{
  "data": {...},
  "related": {
    // Related entities based on resource type
  }
}
```

**Errors**:
- 404: Resource not found

#### POST /api/v1/{resource}
**Description**: Create new resource

**Request**: Resource-specific schema

**Response** (201):
```json
{
  "data": {...},
  "message": "Resource created successfully"
}
```

**Errors**:
- 400: Validation error
- 403: Insufficient permissions
- 409: Conflict (duplicate)

#### PUT /api/v1/{resource}/{id}
**Description**: Update existing resource

**Request**: Resource-specific schema

**Response** (200):
```json
{
  "data": {...},
  "message": "Resource updated successfully"
}
```

**Errors**:
- 400: Validation error
- 403: Insufficient permissions
- 404: Resource not found

#### DELETE /api/v1/{resource}/{id}
**Description**: Soft delete resource

**Response** (200):
```json
{
  "message": "Resource deleted successfully",
  "deleted_at": "2026-01-04T22:00:00Z"
}
```

**Errors**:
- 403: Insufficient permissions
- 404: Resource not found

### 7.4 Specific Resource Endpoints

#### Products
- `GET /api/v1/products` - List products
  - Filters: category_id, supplier_id, discontinued, in_stock, price_min, price_max
  - Search: product_name, category_name, supplier_name
  
- `GET /api/v1/products/{id}` - Get product details
  - Includes: category, supplier, recent_orders (limited)

- `POST /api/v1/products` - Create product (Admin, Manager)
- `PUT /api/v1/products/{id}` - Update product (Admin, Manager)
- `DELETE /api/v1/products/{id}` - Delete product (Admin, Manager)

#### Orders
- `GET /api/v1/orders` - List orders
  - Filters: customer_id, employee_id, status, order_date_from, order_date_to, shipped_date_from, shipped_date_to
  - Search: order_id, customer_name, employee_name
  - Customer role: Automatically filtered to their orders only

- `GET /api/v1/orders/{id}` - Get order details
  - Includes: customer, employee, shipper, order_details with products

- `POST /api/v1/orders` - Create order (Admin, Manager)
- `PUT /api/v1/orders/{id}` - Update order (Admin, Manager)
- `PATCH /api/v1/orders/{id}/status` - Update order status (Admin, Manager)
- `DELETE /api/v1/orders/{id}` - Delete order (Admin, Manager)

#### Customers
- `GET /api/v1/customers` - List customers
  - Filters: country, city, contact_title
  - Search: company_name, contact_name, city, country

- `GET /api/v1/customers/{id}` - Get customer details
  - Includes: orders (paginated), order_statistics

- `POST /api/v1/customers` - Create customer (Admin, Manager)
- `PUT /api/v1/customers/{id}` - Update customer (Admin, Manager, Customer for self)
- `DELETE /api/v1/customers/{id}` - Delete customer (Admin, Manager)

#### Employees
- `GET /api/v1/employees` - List employees
  - Filters: title, reports_to, hire_date_from, hire_date_to
  - Search: first_name, last_name, title

- `GET /api/v1/employees/{id}` - Get employee details
  - Includes: manager, subordinates, orders_processed

- `POST /api/v1/employees` - Create employee (Admin)
- `PUT /api/v1/employees/{id}` - Update employee (Admin)
- `DELETE /api/v1/employees/{id}` - Delete employee (Admin)

#### Categories
- `GET /api/v1/categories` - List categories
- `GET /api/v1/categories/{id}` - Get category with products
- `POST /api/v1/categories` - Create category (Admin, Manager)
- `PUT /api/v1/categories/{id}` - Update category (Admin, Manager)
- `DELETE /api/v1/categories/{id}` - Delete category (Admin, Manager)

#### Suppliers
- `GET /api/v1/suppliers` - List suppliers
  - Filters: country, city
  - Search: company_name, contact_name, city, country

- `GET /api/v1/suppliers/{id}` - Get supplier with products
- `POST /api/v1/suppliers` - Create supplier (Admin, Manager)
- `PUT /api/v1/suppliers/{id}` - Update supplier (Admin, Manager)
- `DELETE /api/v1/suppliers/{id}` - Delete supplier (Admin, Manager)

#### Users (Admin only)
- `GET /api/v1/users` - List users
  - Filters: role, is_active
  - Search: username, email

- `GET /api/v1/users/{id}` - Get user details
- `POST /api/v1/users` - Create user (Admin only)
- `PUT /api/v1/users/{id}` - Update user (Admin only)
- `DELETE /api/v1/users/{id}` - Deactivate user (Admin only)
- `PATCH /api/v1/users/{id}/activate` - Activate user (Admin only)
- `PATCH /api/v1/users/{id}/change-password` - Change password (Admin or self)

#### Dashboard
- `GET /api/v1/dashboard/admin` - Admin dashboard metrics
- `GET /api/v1/dashboard/manager` - Manager dashboard metrics
- `GET /api/v1/dashboard/employee` - Employee dashboard metrics
- `GET /api/v1/dashboard/customer` - Customer dashboard metrics

### 7.5 Error Response Format

All errors follow consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "timestamp": "2026-01-04T22:00:00Z",
    "path": "/api/v1/users"
  }
}
```

**Error Codes**:
- `AUTHENTICATION_FAILED` - Invalid credentials
- `AUTHORIZATION_FAILED` - Insufficient permissions
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Duplicate resource
- `INTERNAL_ERROR` - Server error

### 7.6 API Documentation

- **Swagger UI**: Available at `/docs`
- **ReDoc**: Available at `/redoc`
- **OpenAPI Schema**: Available at `/openapi.json`

---

## 8. Frontend Architecture

### 8.1 Project Structure

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── common/
│   │   │   ├── DataTable.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   ├── SortControls.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   └── features/
│   │       ├── products/
│   │       │   ├── ProductList.tsx
│   │       │   ├── ProductDetail.tsx
│   │       │   ├── ProductForm.tsx
│   │       │   └── ProductFilters.tsx
│   │       ├── orders/
│   │       ├── customers/
│   │       ├── employees/
│   │       ├── dashboard/
│   │       └── users/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePermissions.ts
│   │   ├── usePagination.ts
│   │   ├── useSort.ts
│   │   └── useFilters.ts
│   ├── lib/
│   │   ├── api.ts            # Axios instance
│   │   ├── queryClient.ts    # TanStack Query config
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Products.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── Orders.tsx
│   │   ├── OrderDetail.tsx
│   │   ├── Customers.tsx
│   │   ├── CustomerDetail.tsx
│   │   ├── Employees.tsx
│   │   ├── EmployeeDetail.tsx
│   │   ├── Users.tsx
│   │   ├── Profile.tsx
│   │   └── NotFound.tsx
│   ├── services/
│   │   ├── authService.ts
│   │   ├── productService.ts
│   │   ├── orderService.ts
│   │   ├── customerService.ts
│   │   ├── employeeService.ts
│   │   └── userService.ts
│   ├── store/
│   │   ├── authStore.ts      # Zustand store
│   │   └── uiStore.ts
│   ├── types/
│   │   ├── api.ts
│   │   ├── models.ts
│   │   └── auth.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.development
├── .env.production
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### 8.2 State Management Strategy

#### Zustand Stores
- **authStore**: User authentication state, token, user info
- **uiStore**: UI preferences (theme, sidebar state, page size preferences)

#### TanStack Query
- All server state (products, orders, customers, etc.)
- Automatic caching and revalidation
- Optimistic updates for mutations

#### React Hook Form
- All form state and validation
- Integration with Zod schemas

### 8.3 Routing Structure

```typescript
const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'login', element: <Login /> },
      {
        path: 'dashboard',
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>
      },
      {
        path: 'products',
        element: <ProtectedRoute><Products /></ProtectedRoute>
      },
      {
        path: 'products/:id',
        element: <ProtectedRoute><ProductDetail /></ProtectedRoute>
      },
      {
        path: 'orders',
        element: <ProtectedRoute><Orders /></ProtectedRoute>
      },
      {
        path: 'orders/:id',
        element: <ProtectedRoute><OrderDetail /></ProtectedRoute>
      },
      {
        path: 'customers',
        element: <ProtectedRoute roles={['admin', 'manager']}><Customers /></ProtectedRoute>
      },
      {
        path: 'customers/:id',
        element: <ProtectedRoute><CustomerDetail /></ProtectedRoute>
      },
      {
        path: 'employees',
        element: <ProtectedRoute roles={['admin', 'manager', 'employee']}><Employees /></ProtectedRoute>
      },
      {
        path: 'employees/:id',
        element: <ProtectedRoute><EmployeeDetail /></ProtectedRoute>
      },
      {
        path: 'users',
        element: <ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>
      },
      {
        path: 'profile',
        element: <ProtectedRoute><Profile /></ProtectedRoute>
      },
      { path: '*', element: <NotFound /> }
    ]
  }
];
```

### 8.4 Component Design Patterns

#### DataTable Component
Reusable table with built-in:
- Sorting (multi-column)
- Pagination
- Row selection
- Action buttons
- Responsive design

#### FilterPanel Component
Dynamic filter generation based on entity schema

#### Form Components
- Consistent validation with Zod
- Error display
- Loading states
- Success feedback

---

## 9. Features & Functionality

### 9.1 Search Functionality

#### Implementation
- **Entity-specific**: Each list page has its own search
- **Debounced**: 300ms delay to reduce API calls
- **Backend**: Full-text search using PostgreSQL `ILIKE`
- **Frontend**: Search input in toolbar

#### Search Fields by Entity

**Products**:
- product_name
- category_name (joined)
- supplier_name (joined)

**Orders**:
- order_id
- customer_name (joined)
- employee_name (joined)

**Customers**:
- company_name
- contact_name
- city
- country

**Employees**:
- first_name
- last_name
- title

**Suppliers**:
- company_name
- contact_name
- city
- country

### 9.2 Filtering Functionality

#### Filter Types
1. **Dropdown**: Single or multi-select (categories, suppliers, status)
2. **Range**: Min/max inputs (price, date)
3. **Boolean**: Checkboxes (discontinued, in_stock)
4. **Date Range**: Date pickers (order_date, hire_date)

#### Filters by Entity

**Products**:
- Category (dropdown)
- Supplier (dropdown)
- Price range (min/max)
- Stock status (in stock, low stock, out of stock)
- Discontinued (boolean)

**Orders**:
- Status (dropdown: pending, processing, shipped, delivered, cancelled)
- Customer (dropdown with search)
- Employee (dropdown with search)
- Order date range
- Shipped date range
- Freight range

**Customers**:
- Country (dropdown)
- City (dropdown)
- Contact title (dropdown)

**Employees**:
- Title (dropdown)
- Reports to (dropdown)
- Hire date range

**Suppliers**:
- Country (dropdown)
- City (dropdown)

#### Filter Persistence
- Filters saved to URL query parameters
- Restored on page reload
- Can be bookmarked/shared

### 9.3 Sorting Functionality

#### Features
- **Multi-column**: Primary and secondary sort
- **Toggle**: Click to cycle: none → asc → desc → none
- **Visual indicators**: Arrows showing sort direction
- **Persistence**: Saved to URL and localStorage

#### Implementation
```typescript
interface SortConfig {
  sorts: Array<{
    field: string;
    order: 'asc' | 'desc';
  }>;
}
```

#### Default Sorts by Entity
- **Products**: category_name ASC, product_name ASC
- **Orders**: order_date DESC
- **Customers**: company_name ASC
- **Employees**: last_name ASC, first_name ASC
- **Suppliers**: company_name ASC

### 9.4 Pagination Functionality

#### Configuration
- **Page sizes**: 10, 25, 50, 100
- **Default**: 25 items per page
- **Persistence**: Saved to localStorage per entity
- **UI Components**:
  - Page size selector
  - Page number input
  - Previous/Next buttons
  - First/Last buttons
  - Page info: "Showing 1-25 of 100"

#### Backend Implementation
- Offset-based pagination
- Total count query
- Efficient with indexes

### 9.5 Dashboard Features

#### Admin Dashboard
**Metrics**:
- Total users by role (pie chart)
- Active vs inactive users
- Recent user activity
- Total orders (last 30 days) - line chart
- Revenue trends - line chart
- Low stock alerts - table
- Top selling products - bar chart
- Orders by status - pie chart

**Quick Actions**:
- Create new user
- View system logs
- Export data

#### Manager Dashboard
**Metrics**:
- Sales overview (today, week, month) - cards
- Revenue trends - line chart
- Orders by status - pie chart
- Top 10 products - table
- Top 10 customers - table
- Low stock alerts - table
- Recent orders - table

**Quick Actions**:
- Create new order
- Add product
- View reports

#### Employee Dashboard
**Metrics**:
- Total products - card
- Categories - card
- Suppliers - card
- Recent orders - table
- Product inventory status - table

**Quick Actions**:
- View products
- View orders

#### Customer Dashboard
**Metrics**:
- Total orders - card
- Total spent - card
- Recent orders - table
- Order status breakdown - pie chart
- Favorite products - table

**Quick Actions**:
- Browse products
- View order history

### 9.6 Detail Pages

#### Product Detail Page
**Information**:
- Product name, ID
- Category (linked)
- Supplier (linked)
- Price, quantity per unit
- Stock levels (units in stock, on order, reorder level)
- Discontinued status
- Description

**Related Data**:
- Recent orders containing this product (table)
- Supplier details (expandable)

**Actions** (based on role):
- Edit product
- Delete product
- Mark as discontinued

#### Order Detail Page
**Information**:
- Order ID, dates (ordered, required, shipped)
- Customer (linked)
- Employee (linked)
- Shipper
- Status with timeline
- Shipping address
- Freight cost

**Order Items Table**:
- Product name (linked)
- Unit price
- Quantity
- Discount
- Total

**Summary**:
- Subtotal
- Discount total
- Freight
- Grand total

**Actions** (based on role):
- Edit order
- Update status
- Print invoice
- Delete order

#### Customer Detail Page
**Information**:
- Company name, contact details
- Address
- Phone, fax

**Statistics**:
- Total orders
- Total spent
- Average order value
- First order date
- Last order date

**Related Data**:
- Order history (paginated table)
- Favorite products

**Actions** (based on role):
- Edit customer
- Create order for customer
- Delete customer

#### Employee Detail Page
**Information**:
- Name, title, title of courtesy
- Birth date, hire date
- Address, phone
- Reports to (linked)
- Photo
- Notes

**Statistics**:
- Total orders processed
- Orders this month
- Average order value

**Related Data**:
- Subordinates (if manager)
- Recent orders processed

**Actions** (based on role):
- Edit employee
- Delete employee

---

## 10. Data Seeding

### 10.1 Seeding Strategy

#### Seed Script: `backend/scripts/seed_database.py`

**Functionality**:
1. Check if data already exists
2. If exists, skip seeding (unless `--force` flag)
3. Load standard Northwind dataset from CSV/JSON files
4. Create sample users for each role
5. Link users to customers/employees where applicable
6. Create indexes
7. Verify data integrity

#### Execution
```bash
# Normal seeding (skip if data exists)
python scripts/seed_database.py

# Force re-seed (drops and recreates)
python scripts/seed_database.py --force

# Seed only users
python scripts/seed_database.py --users-only
```

### 10.2 Data Sources

#### Northwind Data
Use standard Northwind dataset from:
- PostgreSQL Northwind sample database
- CSV files in `backend/data/` directory

**Files**:
- `categories.csv`
- `suppliers.csv`
- `products.csv`
- `customers.csv`
- `employees.csv`
- `shippers.csv`
- `orders.csv`
- `order_details.csv`

### 10.3 Sample Users

#### Admin User
```
Username: admin
Password: Admin123!
Email: admin@northwind.com
Role: admin
```

#### Manager User
```
Username: manager
Password: Manager123!
Email: manager@northwind.com
Role: manager
```

#### Employee User
```
Username: employee
Password: Employee123!
Email: employee@northwind.com
Role: employee
```

#### Customer Users
Create 5 customer users linked to existing Northwind customers:
```
Username: customer1, customer2, ..., customer5
Password: Customer123!
Email: customer1@example.com, ...
Role: customer
Linked to: First 5 customers in database
```

### 10.4 Data Validation

After seeding, verify:
- All foreign keys are valid
- No orphaned records
- User passwords are hashed
- Indexes are created
- Row counts match expected values

---

## 11. Testing Strategy

### 11.1 Backend Testing

#### Unit Tests (pytest)
**Coverage Target**: 80%+

**Test Files Structure**:
```
backend/tests/
├── unit/
│   ├── test_auth.py
│   ├── test_models.py
│   ├── test_services/
│   │   ├── test_product_service.py
│   │   ├── test_order_service.py
│   │   └── ...
│   └── test_utils.py
├── integration/
│   ├── test_api/
│   │   ├── test_auth_endpoints.py
│   │   ├── test_product_endpoints.py
│   │   ├── test_order_endpoints.py
│   │   └── ...
│   └── test_database.py
└── conftest.py
```

**Test Categories**:

1. **Authentication Tests**
   - Login with valid credentials
   - Login with invalid credentials
   - JWT token generation
   - JWT token validation
   - Token expiration
   - Protected endpoint access

2. **Authorization Tests**
   - Admin access to all endpoints
   - Manager access restrictions
   - Employee read-only access
   - Customer data isolation

3. **CRUD Tests** (for each entity)
   - Create with valid data
   - Create with invalid data
   - Read single resource
   - Read list with pagination
   - Update with valid data
   - Update with invalid data
   - Soft delete
   - Restore deleted

4. **Search Tests**
   - Search by various fields
   - Case-insensitive search
   - Empty search results
   - Search with special characters

5. **Filter Tests**
   - Single filter
   - Multiple filters combined
   - Range filters
   - Invalid filter values

6. **Sort Tests**
   - Single column sort
   - Multi-column sort
   - Sort direction toggle

7. **Pagination Tests**
   - Different page sizes
   - Page boundaries
   - Invalid page numbers

8. **Validation Tests**
   - Required fields
   - Field formats (email, phone)
   - Field lengths
   - Foreign key constraints

#### Integration Tests
- Database transactions
- API endpoint workflows
- Multi-step operations (e.g., create order with items)

#### Test Fixtures
```python
# conftest.py
@pytest.fixture
def test_db():
    """Create test database"""
    
@pytest.fixture
def admin_token():
    """Generate admin JWT token"""
    
@pytest.fixture
def sample_product():
    """Create sample product"""
```

#### Running Tests
```bash
# All tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Specific test file
pytest tests/unit/test_auth.py

# Specific test
pytest tests/unit/test_auth.py::test_login_success

# Integration tests only
pytest tests/integration/
```

### 11.2 Frontend Testing

#### Unit Tests (Vitest)
**Coverage Target**: 70%+

**Test Files Structure**:
```
frontend/src/
├── components/
│   ├── __tests__/
│   │   ├── DataTable.test.tsx
│   │   ├── Pagination.test.tsx
│   │   └── ...
├── hooks/
│   ├── __tests__/
│   │   ├── useAuth.test.ts
│   │   └── ...
└── services/
    ├── __tests__/
    │   ├── authService.test.ts
    │   └── ...
```

**Test Categories**:

1. **Component Tests**
   - Rendering with props
   - User interactions
   - Conditional rendering
   - Error states
   - Loading states

2. **Hook Tests**
   - State management
   - Side effects
   - Custom logic

3. **Service Tests**
   - API calls (mocked)
   - Error handling
   - Data transformation

#### E2E Tests (Playwright)
**Test Scenarios**:

1. **Authentication Flow**
   - Login as each role
   - Logout
   - Protected route access
   - Invalid credentials

2. **Product Management**
   - View product list
   - Search products
   - Filter products
   - Sort products
   - Paginate products
   - View product detail
   - Create product (Manager)
   - Edit product (Manager)
   - Delete product (Manager)

3. **Order Management**
   - View orders
   - Filter by status
   - View order detail
   - Create order (Manager)
   - Update order status (Manager)

4. **User Management** (Admin)
   - View users
   - Create user
   - Edit user
   - Deactivate user

5. **Dashboard**
   - View role-specific dashboard
   - Verify metrics display
   - Interact with charts

6. **Responsive Design**
   - Test on mobile viewport
   - Test on tablet viewport
   - Test on desktop viewport

**Test Files**:
```
frontend/e2e/
├── auth.spec.ts
├── products.spec.ts
├── orders.spec.ts
├── customers.spec.ts
├── employees.spec.ts
├── users.spec.ts
└── dashboard.spec.ts
```

#### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

### 11.3 Test Data Management

- Use factories for test data generation
- Separate test database
- Cleanup after each test
- Consistent seed data for E2E tests

---

## 12. Deployment & DevOps

### 12.1 Docker Configuration

#### docker-compose.yml
```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      JWT_ALGORITHM: HS256
      JWT_EXPIRATION: 86400
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    environment:
      VITE_API_URL: http://localhost:8000/api/v1
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
```

#### Backend Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run migrations and seed on startup
CMD alembic upgrade head && \
    python scripts/seed_database.py && \
    uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend Dockerfile
```dockerfile
# Development stage
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# Production stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 12.2 Environment Variables

#### Backend (.env)
```bash
# Database
DB_HOST=db
DB_PORT=5432
DB_NAME=northwind
DB_USER=postgres
DB_PASSWORD=your_secure_password
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# JWT
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION=86400

# API
API_V1_PREFIX=/api/v1
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Environment
ENVIRONMENT=development
DEBUG=true
```

#### Frontend (.env)
```bash
# Development
VITE_API_URL=http://localhost:8000/api/v1

# Production
# VITE_API_URL=https://api.yourdomain.com/api/v1
```

### 12.3 Deployment Commands

#### Local Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# Run migrations
docker-compose exec backend alembic upgrade head

# Seed database
docker-compose exec backend python scripts/seed_database.py

# Run backend tests
docker-compose exec backend pytest

# Access database
docker-compose exec db psql -U postgres -d northwind
```

#### Production Build
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Scale backend
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### 12.4 CI/CD Pipeline (GitHub Actions Example)

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      - name: Run tests
        run: |
          cd frontend
          npm run test
      - name: Build
        run: |
          cd frontend
          npm run build
```

---

## 13. Documentation Requirements

### 13.1 Architecture Documentation

Create in `docs/architecture/`:

1. **system-architecture.md**
   - High-level architecture diagram
   - Component interactions
   - Data flow diagrams
   - Technology stack rationale

2. **database-schema.md**
   - ER diagrams
   - Table descriptions
   - Relationship explanations
   - Index strategy

3. **api-architecture.md**
   - API design principles
   - Endpoint organization
   - Authentication flow
   - Error handling strategy

4. **frontend-architecture.md**
   - Component hierarchy
   - State management strategy
   - Routing structure
   - Build process

### 13.2 Developer Documentation

Create in `docs/development/`:

1. **setup-guide.md**
   - Prerequisites
   - Local environment setup
   - Docker setup
   - Database setup
   - Running the application

2. **coding-standards.md**
   - Python style guide (PEP 8)
   - TypeScript/React conventions
   - Naming conventions
   - Code organization

3. **testing-guide.md**
   - Testing philosophy
   - Writing tests
   - Running tests
   - Coverage requirements

4. **deployment-guide.md**
   - Environment configuration
   - Docker deployment
   - Production considerations
   - Monitoring and logging

### 13.3 API Documentation

- Auto-generated from FastAPI (Swagger/ReDoc)
- Additional manual documentation in `docs/api/`:
  - Authentication guide
  - Common use cases
  - Error handling
  - Rate limiting

### 13.4 User Documentation

Create in `docs/user/`:

1. **user-guide.md**
   - Getting started
   - Feature walkthroughs
   - Role-specific guides
   - FAQ

2. **admin-guide.md**
   - User management
   - System configuration
   - Monitoring
   - Troubleshooting

### 13.5 README Files

#### Root README.md
- Project overview
- Quick start
- Links to detailed documentation
- Contributing guidelines
- License

#### Backend README.md
- Backend-specific setup
- API overview
- Database migrations
- Testing

#### Frontend README.md
- Frontend-specific setup
- Available scripts
- Component library
- Testing

---

## 14. Development Workflow

### 14.1 Initial Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd northwind-test
   ```

2. **Environment Setup**
   ```bash
   # Copy environment templates
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   
   # Edit with your values
   nano backend/.env
   nano frontend/.env
   ```

3. **Start with Docker**
   ```bash
   docker-compose up -d
   ```

4. **Verify Setup**
   - Backend: http://localhost:8000/docs
   - Frontend: http://localhost:5173
   - Database: localhost:5432

### 14.2 Development Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/feature-name
   ```

2. **Make Changes**
   - Write code
   - Write tests
   - Update documentation

3. **Run Tests**
   ```bash
   # Backend
   docker-compose exec backend pytest
   
   # Frontend
   cd frontend && npm run test
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: description of changes"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/feature-name
   ```

### 14.3 Database Migrations

```bash
# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker-compose exec backend alembic upgrade head

# Rollback
docker-compose exec backend alembic downgrade -1

# View history
docker-compose exec backend alembic history
```

### 14.4 Code Quality

#### Backend
```bash
# Linting
black backend/
flake8 backend/
mypy backend/

# Security check
bandit -r backend/
```

#### Frontend
```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format
npm run format
```

---

## 15. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup and structure
- [ ] Docker configuration
- [ ] Database schema and migrations
- [ ] Basic FastAPI setup with health check
- [ ] React + Vite setup with routing
- [ ] Authentication system (JWT)
- [ ] User model and CRUD

### Phase 2: Core Entities (Week 3-4)
- [ ] Products API and UI
- [ ] Categories API and UI
- [ ] Suppliers API and UI
- [ ] Basic search, filter, sort, pagination
- [ ] Data seeding scripts

### Phase 3: Orders & Customers (Week 5-6)
- [ ] Customers API and UI
- [ ] Orders API and UI
- [ ] Order details
- [ ] Employees API and UI
- [ ] Role-based access control

### Phase 4: Advanced Features (Week 7-8)
- [ ] Dashboard for all roles
- [ ] Charts and visualizations
- [ ] Multi-column sorting
- [ ] Advanced filtering
- [ ] Detail pages with related data

### Phase 5: Polish & Testing (Week 9-10)
- [ ] Comprehensive backend tests
- [ ] Frontend unit tests
- [ ] E2E tests with Playwright
- [ ] Performance optimization
- [ ] Documentation completion
- [ ] Security audit

### Phase 6: Deployment (Week 11-12)
- [ ] Production Docker setup
- [ ] CI/CD pipeline
- [ ] Monitoring and logging
- [ ] Final testing
- [ ] Deployment to production

---

## 16. Success Criteria

### Functional Requirements
- ✅ All CRUD operations work for all entities
- ✅ Role-based access control enforced
- ✅ Search, filter, sort, pagination work correctly
- ✅ Authentication and authorization secure
- ✅ Dashboards display accurate metrics
- ✅ Data seeding creates complete dataset

### Non-Functional Requirements
- ✅ Backend test coverage > 80%
- ✅ Frontend test coverage > 70%
- ✅ API response time < 200ms (95th percentile)
- ✅ Page load time < 2s
- ✅ Mobile responsive (320px - 2560px)
- ✅ Accessible (WCAG 2.1 AA)
- ✅ All documentation complete

### Technical Requirements
- ✅ Docker deployment works
- ✅ Database migrations work
- ✅ API documentation auto-generated
- ✅ No security vulnerabilities
- ✅ Code follows style guides
- ✅ Git history clean and organized

---

## Appendix A: Sample API Requests

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin123!"}'
```

### Get Products
```bash
curl -X GET "http://localhost:8000/api/v1/products?page=1&page_size=25&sort_by=product_name&sort_order=asc" \
  -H "Authorization: Bearer <token>"
```

### Create Product
```bash
curl -X POST http://localhost:8000/api/v1/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "New Product",
    "supplier_id": 1,
    "category_id": 1,
    "quantity_per_unit": "10 boxes",
    "unit_price": 19.99,
    "units_in_stock": 100,
    "units_on_order": 0,
    "reorder_level": 10,
    "discontinued": false
  }'
```

---

## Appendix B: Database Seed Data Statistics

Expected row counts after seeding:
- Categories: 8
- Suppliers: 29
- Products: 77
- Customers: 91
- Employees: 9
- Shippers: 3
- Orders: 830
- Order Details: 2,155
- Users: 9 (1 admin, 1 manager, 1 employee, 5 customers, 1 linked to employee)

---

## Appendix C: Technology Alternatives Considered

| Category | Chosen | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Frontend Framework | React | Vue, Angular, Svelte | Most popular, best ecosystem, team familiarity |
| State Management | Zustand | Redux, Recoil, Jotai | Simpler API, less boilerplate, sufficient for needs |
| Backend Framework | FastAPI | Django, Flask, Express | Best async support, auto-docs, type safety |
| ORM | SQLAlchemy | Django ORM, Prisma | Mature, flexible, Python standard |
| Database | PostgreSQL | MySQL, MongoDB | Best for relational data, JSON support, performance |
| UI Library | shadcn/ui | Material-UI, Ant Design | Customizable, modern, Tailwind-based |

---

**End of Specification**

This specification is a living document and should be updated as the project evolves.
