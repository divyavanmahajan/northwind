# Backend Architecture

## Entry Point

`backend/app/main.py` — FastAPI app factory. Registers:
- CORS middleware (allows `localhost:5173` and `localhost:3000` in dev)
- `RequestLoggingMiddleware` for HTTP request/response logging
- Custom exception handlers for `HTTPException`, `AppException`, `RequestValidationError`, and uncaught `Exception`
- All routers under the `/api/v1` prefix

## Configuration

`backend/app/config.py` — Pydantic `Settings` class reads from environment variables. Key settings:

| Variable | Purpose |
|----------|---------|
| `DB_*` | PostgreSQL connection details |
| `JWT_SECRET` | Token signing key (min 32 chars) |
| `JWT_ALGORITHM` | Default `HS256` |
| `JWT_EXPIRATION` | Seconds until token expires (default 86400) |
| `DEBUG` | Enables verbose errors and INFO logging |
| `CORS_ORIGINS` | Comma-separated allowed origins |

## Database Layer

`backend/app/database.py` — Creates the SQLAlchemy engine and `SessionLocal` factory.
Sessions are injected into route handlers via `get_db()` dependency.

## Models (`backend/app/models/`)

All application models inherit from `base.py` (declarative base with `created_at`, `updated_at`, `deleted_at` audit columns for soft deletes).

| File | SQLAlchemy Model | DB Table |
|------|-----------------|---------|
| `user.py` | `User` | `users` |
| `category.py` | `Category` | `categories` |
| `supplier.py` | `Supplier` | `suppliers` |
| `product.py` | `Product` | `products` |
| `customer.py` | `Customer` | `customers` |
| `employee.py` | `Employee` | `employees` |
| `order.py` | `Order` | `orders` |
| `order_detail.py` | `OrderDetail` | `order_details` |
| `shipper.py` | `Shipper` | `shippers` |

**Conventions:**
- Snake_case column names (migrated from PascalCase legacy schema)
- String-based customer IDs (5-char, e.g. `ALFKI`)
- `photo_path` instead of binary BLOB for employee photos
- Boolean `discontinued` (was `char(1)`)
- Soft-delete via `deleted_at` timestamp

## Schemas (`backend/app/schemas/`)

Pydantic v2 schemas define request bodies and response shapes. Pattern per resource:
- `XxxCreate` — fields required on POST
- `XxxUpdate` — fields allowed on PUT (all optional)
- `XxxResponse` — shape returned to client
- `XxxList` — paginated list wrapper: `{ items, total, skip, limit }`

`schemas/common.py` defines shared types: `ErrorResponse`, `ErrorDetail`, pagination params.

## Services (`backend/app/services/`)

Business logic is separated from route handlers. Services receive a `db: Session` and return model instances or raise `AppException`. Route handlers call services and map results to schemas.

## Routers (`backend/app/routers/`)

| File | Prefix | Description |
|------|--------|-------------|
| `health.py` | `/health` | Health check endpoint |
| `auth.py` | `/auth` | Login, register, `/me` |
| `categories.py` | `/categories` | Category CRUD |
| `suppliers.py` | `/suppliers` | Supplier CRUD |
| `products.py` | `/products` | Product CRUD + search |
| `customers.py` | `/customers` | Customer CRUD |
| `employees.py` | `/employees` | Employee CRUD |
| `orders.py` | `/orders` | Order CRUD + status patch |
| `shippers.py` | `/shippers` | Shippers list |
| `dashboard.py` | `/dashboard` | Stats + chart data |
| `users.py` | `/users` | User management (admin) |

All CRUD endpoints follow:
- `GET /` — paginated list with optional `search`, `skip`, `limit`
- `GET /{id}` — single resource
- `POST /` — create
- `PUT /{id}` — full update
- `DELETE /{id}` — soft delete

## Authentication

`backend/app/core/` (or `auth/`) contains:
- Password hashing with **bcrypt**
- JWT creation/verification
- `get_current_user` dependency — validates Bearer token, returns `User`
- `require_role(...)` dependency factory — enforces Admin/Manager/Employee RBAC

## Error Handling

Custom `AppException(status_code, code, message, details)` is raised from services and mapped to a consistent JSON envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": [...],
    "timestamp": "2024-01-01T00:00:00",
    "path": "/api/v1/..."
  }
}
```

## Middleware

`backend/app/middleware/logging.py` — `RequestLoggingMiddleware` logs method, path, status code, and duration for every request.

## Migrations

Managed with **Alembic**. Migration files live in `backend/alembic/versions/`.

```bash
# Create a new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker-compose exec backend alembic upgrade head

# Rollback one step
docker-compose exec backend alembic downgrade -1
```

## Tests

```
backend/tests/
├── conftest.py        # pytest fixtures (test DB, test client, auth helpers)
├── unit/              # Unit tests for services and utilities
└── integration/       # Integration tests hitting the full API
```

**Run tests:**
```bash
docker-compose exec backend pytest
docker-compose exec backend pytest --cov=app --cov-report=html
docker-compose exec backend pytest tests/unit/test_products.py  # specific file
```

Target: **80% coverage**.

## Code Quality

```bash
cd backend
black app/          # formatting
flake8 app/         # linting
mypy app/           # type checking
bandit -r app/      # security scan
```

## Requirements

`backend/requirements.txt` — key packages: `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `alembic`, `pydantic[email]`, `python-jose[cryptography]`, `passlib[bcrypt]`, `psycopg2-binary`, `gunicorn`.
