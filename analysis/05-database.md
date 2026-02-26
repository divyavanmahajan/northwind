# Database

## Overview

The database uses a **two-tier structure**:

1. **Legacy tables** — loaded from `northwind-docker.sql` at container startup. These are the original 1990s-era Northwind schema (PascalCase, integer IDs). Treat as **read-only seed data**.
2. **Application tables** — created by Alembic migrations. These are the tables the FastAPI backend reads and writes.

Data is migrated from legacy to application tables via a one-time seeding script that applies all transformations.

## Application Schema

All application tables have audit columns: `created_at`, `updated_at`, `deleted_at` (soft delete).

### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `email` | varchar (unique) | |
| `username` | varchar (unique, indexed) | |
| `password_hash` | varchar | bcrypt |
| `role` | ENUM | `admin`, `manager`, `employee`, `customer` |
| `is_active` | boolean | |
| `last_login` | timestamp | |
| `created_by` | UUID FK → users | |

### `categories`
| Column | Type | Notes |
|--------|------|-------|
| `id` | integer PK | |
| `name` | varchar | |
| `description` | text | |

### `suppliers`
| Column | Type | Notes |
|--------|------|-------|
| `id` | integer PK | |
| `company_name` | varchar | |
| `contact_name` | varchar | |
| `contact_title` | varchar | |
| `address`, `city`, `region`, `postal_code`, `country` | varchar | |
| `phone`, `fax` | varchar | |

### `products`
| Column | Type | Notes |
|--------|------|-------|
| `id` | integer PK | |
| `name` | varchar (indexed) | |
| `supplier_id` | integer FK → suppliers | |
| `category_id` | integer FK → categories | |
| `quantity_per_unit` | varchar | |
| `unit_price` | numeric | |
| `units_in_stock` | integer | |
| `units_on_order` | integer | |
| `reorder_level` | integer | |
| `discontinued` | boolean | was `char(1)` in legacy |

Stock status property: `in_stock`, `low_stock`, `out_of_stock`, `discontinued`

### `customers`
| Column | Type | Notes |
|--------|------|-------|
| `id` | varchar(5) PK | `ALFKI` style — padded from integer seed |
| `company_name` | varchar | |
| `contact_name`, `contact_title` | varchar | |
| `address`, `city`, `region`, `postal_code`, `country` | varchar | |
| `phone`, `fax` | varchar | |
| `user_id` | UUID FK → users | links to login account |

### `employees`
| Column | Type | Notes |
|--------|------|-------|
| `id` | integer PK | |
| `first_name`, `last_name` | varchar | |
| `title` | varchar | |
| `birth_date`, `hire_date` | date | |
| `reports_to` | integer FK → employees | hierarchy (was `mgrid`) |
| `home_phone` | varchar | (was `phone`) |
| `photo_path` | varchar | file path, not binary BLOB |
| `user_id` | UUID FK → users | links to login account |

### `orders`
| Column | Type | Notes |
|--------|------|-------|
| `id` | integer PK | |
| `customer_id` | varchar(5) FK → customers | |
| `employee_id` | integer FK → employees | |
| `order_date` | date | type changed from timestamp |
| `required_date`, `shipped_date` | date | |
| `ship_via` | integer FK → shippers | (was `shipperid`) |
| `freight` | numeric | |
| `ship_name`, `ship_address`, `ship_city`, `ship_region`, `ship_postal_code`, `ship_country` | varchar | |
| `status` | ENUM | `pending`, `processing`, `shipped`, `delivered`, `cancelled` |

Computed properties: `subtotal`, `discount_total`, `total`

### `order_details`
| Column | Type | Notes |
|--------|------|-------|
| `order_id` | integer FK → orders (composite PK) | |
| `product_id` | integer FK → products (composite PK) | |
| `unit_price` | numeric | |
| `quantity` | integer | |
| `discount` | float | |

### `shippers`
| Column | Type | Notes |
|--------|------|-------|
| `id` | integer PK | |
| `company_name` | varchar | |
| `phone` | varchar | |

## Seed Data Quantities

| Entity | Count |
|--------|-------|
| Categories | 8 |
| Suppliers | 29 |
| Products | 77 |
| Customers | 91 |
| Employees | 9 |
| Shippers | 3 |
| Orders | 830 |
| Order Details | 2,155 |

## Key Schema Decisions

| Change | Reason |
|--------|--------|
| `snake_case` columns | Python/SQLAlchemy conventions |
| `customers.id` = varchar(5) | Match standard Northwind convention (e.g., `ALFKI`) |
| `photo_path` not binary BLOB | Performance — store file paths instead |
| Soft delete via `deleted_at` | Data recovery + referential integrity |
| `users` table | RBAC was absent in original schema |
| `orders.status` ENUM | Modern workflow tracking |
| `order_date` as `DATE` | Business logic (date-only, not timestamp) |

## Migrations

### Creating a Migration

```bash
docker-compose exec backend alembic revision --autogenerate -m "describe change"
```

Review the generated file in `backend/alembic/versions/` before applying.

### Applying Migrations

```bash
docker-compose exec backend alembic upgrade head
```

### Rolling Back

```bash
docker-compose exec backend alembic downgrade -1
```

### Rules

- Only modify Alembic-managed application tables in migrations
- Never alter legacy seed tables (`category`, `product`, `customer`, etc.)
- Always review auto-generated migrations before applying
- Migration files are committed to git

## Database Reset

```bash
docker-compose down
docker volume rm northwind-test_postgres_data
docker-compose up -d
```

This re-runs the seed script and re-applies all migrations.

## Backups (Production)

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec db \
  pg_dump -U northwind_user northwind_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker-compose -f docker-compose.prod.yml exec -T db \
  psql -U northwind_user northwind_prod < backup.sql
```
