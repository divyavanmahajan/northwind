# Prompt 23: Data Seeding Scripts

## Context
Beginning Phase 5: Advanced Features. The database is seeded with Northwind data automatically via Docker.

## Prerequisites
- All entity models created (Prompts 11-22)
- Docker containers running

## Goals
1. Understand the SQL-based seeding approach
2. Create sample users for each role
3. Link users to customers/employees
4. Verify data integrity

---

## Data Source

The Northwind database seed data comes from an official SQL script:

**Source URL:** https://github.com/harryho/db-samples/blob/2050c61088775c101c48b9747a2e4eb96a201ad2/pgsql/northwind.sql

**Local Path:** `backend/data/northwind.sql`

### Database Schema (from SQL script)

The SQL script creates the following tables with their naming conventions:

| Table Name | Description | Row Count |
|------------|-------------|-----------|
| Category | Product categories | 8 |
| Supplier | Product suppliers | 29 |
| Product | Products catalog | 77 |
| Customer | Customer companies | 91 |
| Employee | Company employees | 9 |
| Shipper | Shipping companies | 3 |
| SalesOrder | Customer orders | 830+ |
| OrderDetail | Order line items | 2155+ |
| Region | Geographic regions | 4 |
| Territory | Sales territories | 53 |
| EmployeeTerritory | Employee-territory assignments | - |
| CustomerDemographic | Customer demographics | - |
| CustomerCustomerDemographic | Customer-demographic mapping | - |

### Key Column Naming Notes

The SQL script uses these naming conventions (different from typical SQLAlchemy conventions):

- **Customer ID:** `custid` (not `customer_id`)
- **Employee ID:** `empid` (not `employee_id`)
- **Order ID:** `orderid` (not `order_id`)
- **Product ID:** `productid` (not `product_id`)
- **Category ID:** `categoryid` (not `category_id`)
- **Supplier ID:** `supplierid` (not `supplier_id`)
- **Shipper ID:** `shipperid` (not `shipper_id`)
- **Manager ID:** `mgrid` (not `reports_to`)

---

## Prompt

```text
Configure data seeding for the Northwind database.

AUTOMATIC SEEDING VIA DOCKER:
The docker-compose.yml mounts the SQL file to PostgreSQL's initialization directory:
  volumes:
    - ./backend/data/northwind.sql:/docker-entrypoint-initdb.d/01-northwind.sql:ro

PostgreSQL automatically executes scripts in /docker-entrypoint-initdb.d/ on first 
container startup (when the data volume is empty).

To re-seed the database:
1. Stop containers: docker-compose down
2. Remove the volume: docker volume rm northwind-test_postgres_data
3. Start containers: docker-compose up -d

SQLALCHEMY MODEL MAPPING:
Your SQLAlchemy models should map to the existing table and column names.
Example for Customer model:

```python
from sqlalchemy import Column, Integer, String
from app.database import Base

class Customer(Base):
    __tablename__ = "customer"  # Matches SQL table name
    
    custid = Column("custid", Integer, primary_key=True)
    companyname = Column("companyname", String(40), nullable=False)
    contactname = Column("contactname", String(30))
    contacttitle = Column("contacttitle", String(30))
    address = Column("address", String(60))
    city = Column("city", String(15))
    region = Column("region", String(15))
    postalcode = Column("postalcode", String(10))
    country = Column("country", String(15))
    phone = Column("phone", String(24))
    fax = Column("fax", String(24))
    
    # Add property for consistent API naming
    @property
    def customer_id(self):
        return self.custid
```

USER SEED SCRIPT (backend/scripts/seed_users.py):
Since the Northwind SQL only includes business data (not application users),
create a separate script for seeding users:

```python
#!/usr/bin/env python
"""
Seed sample users for the Northwind application.

Usage:
    python scripts/seed_users.py          # Create sample users
    python scripts/seed_users.py --force  # Force re-create users
"""
import argparse
from sqlalchemy import text

from app.database import SessionLocal
from app.services.user_service import UserService
from app.schemas.user import UserCreate
from app.models.user import UserRole


def seed_users(db, force=False):
    """Create sample users for each role."""
    service = UserService(db)
    
    users_to_create = [
        {"username": "admin", "email": "admin@northwind.com", "password": "Admin123!", "role": UserRole.ADMIN},
        {"username": "manager", "email": "manager@northwind.com", "password": "Manager123!", "role": UserRole.MANAGER},
        {"username": "employee", "email": "employee@northwind.com", "password": "Employee123!", "role": UserRole.EMPLOYEE},
    ]
    
    # Get first 5 customers from the database
    result = db.execute(text("SELECT custid, companyname FROM customer LIMIT 5"))
    customers = result.fetchall()
    
    for i, (custid, companyname) in enumerate(customers, 1):
        users_to_create.append({
            "username": f"customer{i}",
            "email": f"customer{i}@example.com",
            "password": "Customer123!",
            "role": UserRole.CUSTOMER,
            "link_customer_id": custid
        })
    
    for user_data in users_to_create:
        link_customer_id = user_data.pop("link_customer_id", None)
        
        existing = service.get_by_username(user_data["username"])
        if existing:
            if force:
                service.delete(existing.user_id)
                print(f"Deleted existing user: {user_data['username']}")
            else:
                print(f"User {user_data['username']} already exists, skipping...")
                continue
        
        user = service.create(UserCreate(**user_data))
        print(f"Created user: {user.username} ({user.role.value})")
        
        if link_customer_id:
            db.execute(
                text("UPDATE customer SET user_id = :user_id WHERE custid = :custid"),
                {"user_id": user.user_id, "custid": link_customer_id}
            )
            db.commit()
            print(f"  -> Linked to customer {link_customer_id}")


def verify_data(db):
    """Verify seeded data counts."""
    print("\n=== Data Verification ===")
    
    tables = [
        ("category", "Categories"),
        ("supplier", "Suppliers"),
        ("product", "Products"),
        ("customer", "Customers"),
        ("employee", "Employees"),
        ("shipper", "Shippers"),
        ("salesorder", "Orders"),
        ("orderdetail", "Order Details"),
    ]
    
    for table, label in tables:
        result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
        count = result.scalar()
        print(f"{label}: {count}")
    
    # Check users table if it exists
    try:
        result = db.execute(text("SELECT COUNT(*) FROM users"))
        count = result.scalar()
        print(f"Users: {count}")
    except Exception:
        print("Users: (table not yet created)")


def main():
    parser = argparse.ArgumentParser(description='Seed Northwind users')
    parser.add_argument('--force', action='store_true', help='Force re-create users')
    args = parser.parse_args()
    
    db = SessionLocal()
    
    try:
        seed_users(db, force=args.force)
        verify_data(db)
        print("\n✅ User seeding complete!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
```

VERIFICATION:
1. Start fresh containers: 
   docker-compose down && docker volume rm northwind-test_postgres_data && docker-compose up -d

2. Check the database tables:
   docker-compose exec db psql -U postgres -d northwind -c "\dt"

3. Verify data counts:
   docker-compose exec db psql -U postgres -d northwind -c "SELECT 'Categories' as table_name, COUNT(*) FROM category UNION ALL SELECT 'Suppliers', COUNT(*) FROM supplier UNION ALL SELECT 'Products', COUNT(*) FROM product UNION ALL SELECT 'Customers', COUNT(*) FROM customer UNION ALL SELECT 'Employees', COUNT(*) FROM employee UNION ALL SELECT 'Orders', COUNT(*) FROM salesorder;"

4. Run user seeding (after implementing the users model):
   docker-compose exec backend python scripts/seed_users.py

SUCCESS CRITERIA:
- All Northwind tables created with data
- Categories: 8 rows
- Suppliers: 29 rows
- Products: 77 rows
- Customers: 91 rows
- Employees: 9 rows
- Orders: 830+ rows
- Sample users created for each role (after user implementation)
```

---

## Expected File Structure

```
backend/
├── data/
│   ├── northwind.sql          # Full Northwind SQL (schema + data)
│   └── northwind-seed.sql     # Schema-only reference
├── scripts/
│   └── seed_users.py          # User seeding script
```

---

## Verification Checklist

- [ ] Docker volume mounts SQL file correctly
- [ ] PostgreSQL initializes with Northwind data on first startup
- [ ] All tables created with correct schema
- [ ] Data counts match expected values
- [ ] SQLAlchemy models map to existing tables
- [ ] User seeding script creates sample users

---

## Next Step
Proceed to [Prompt 24: Dashboard API Endpoints](./24-dashboard-api.md)
