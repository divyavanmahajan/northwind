# Database Documentation

This document describes the relationship between the original Northwind seed dataset and the modernized database schema managed by Alembic.

## Overview

The database uses a two-tier structure. The original Northwind tables were loaded from the seed SQL script to serve as the data source, while the application operates on a modernized schema designed for performance, security, and Python/SQLAlchemy compatibility.

- **Legacy Tables**: Created by `northwind-docker.sql`. These follow the original 1990s Northwind schema.
- **Application Tables**: Created by Alembic migrations. These are the tables used by the FastAPI backend.

---

## Table Mapping Summary

| Legacy Table (Seed) | Application Table (Alembic) | Key Changes |
| :--- | :--- | :--- |
| `category` | `categories` | Plural naming, added audit timestamps. |
| `customer` | `customers` | ID changed from Integer to 5-char String. Linked to `users`. |
| `employee` | `employees` | Simplified binary handling (photo_path). Added `user_id`. |
| `product` | `products` | Added explicit Foreign Keys for Suppliers and Categories. |
| `salesorder` | `orders` | Combined with status tracking. Dates mapped to `Date` type. |
| `orderdetail` | `order_details` | Snake_case naming, explicit Foreign Keys. |
| `supplier` | `suppliers` | Modernized field lengths. |
| `shipper` | `shippers` | Expanded field lengths. |

---

## Detailed Schema Modernization

### 1. Unified Audit System
All main application tables include professional audit columns:
- `created_at`: Timestamp (with time zone) when the record was created.
- `updated_at`: Timestamp (with time zone) updated on every modification.
- `deleted_at`: Used for **Soft Deletes**, allowing data recovery and maintaining referential integrity.

### 2. Column Modernization
| Table | Original Column | New Column | Change Detail |
| :--- | :--- | :--- | :--- |
| **All** | `PascalCase` | `snake_case` | Standardized for Python ecosystem. |
| **Product** | `discontinued` | `discontinued` | Changed from `char(1)` ('0'/'1') to `boolean`. |
| **Order** | `shipperid` | `ship_via` | Descriptive naming for Shipper relationship. |
| **Order** | `orderdate` | `order_date` | Type changed from `timestamp` to `date` for business logic. |
| **Employee** | `mgrid` | `reports_to` | Clearer hierarchy naming. |
| **Employee** | `phone` | `home_phone` | Specificity for employee contact. |
| **Employee** | `photo` | `photo_path` | Replaced binary BLOB with file-system path (Performance). |

### 3. Customer ID Transformation
The original Northwind database uses integer IDs for customers in some SQL versions, but the application requires a 5-character string ID (matching standard Northwind conventions like `ALFKI`).

- **Transformation**: During migration, integer IDs (e.g., `1`) were converted to 5-character padded strings (e.g., `00001`).
- **Primary Key**: String-based IDs allow for more descriptive keys and better alignment with external Northwind integrations.

### 4. Authentication Integration
The application schema introduces a `users` table that acts as the primary identity provider.
- `customers.user_id`: Links a customer profile to a login account.
- `employees.user_id`: Links an employee record to a staff login account.
- **Roles**: The `users` table handles role-based access control (RBAC) which was absent in the original schema.

---

## Migration Logic

Data is synchronized from the legacy tables to the application tables using the following logic:
1. **Truncation**: Target application tables are cleared.
2. **Transformation**: Data is selected from legacy tables, applying snake_case mapping and ID padding.
3. **Status Mapping**: `SalesOrder` records are assigned a status (e.g., `SHIPPED` or `PENDING`) based on their `shipped_date` value.
4. **Foreign Key Integrity**: Data is imported in dependency order (Categories/Suppliers -> Products -> Customers/Employees -> Orders -> Order Details).

## Maintenance
New application features should only modify the **Alembic-managed tables**. The original `customer`, `product`, etc., tables should be treated as read-only seed data sources.
